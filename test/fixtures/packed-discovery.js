'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const userDirectory = process.argv[2];
const exampleFile = process.argv[3] || 'example.json';
const packageName = process.argv[4];
assert.ok(packageName, 'expected package identity is required');
const installedRequire = createRequire(path.join(userDirectory, 'package.json'));
assert.equal(installedRequire(`${packageName}/package.json`).name, packageName);
const RED = installedRequire('node-red');
const azure = installedRequire('azure-iot-device');
const logs = [];
const received = [];
const clients = [];
const devices = [];

async function waitFor(predicate) {
    const deadline = Date.now() + 5000;
    while (!predicate()) {
        assert.ok(Date.now() < deadline, `${exampleFile}: packed flow did not become ready`);
        await new Promise((resolve) => setTimeout(resolve, 5));
    }
}

class FakeClient extends EventEmitter {
    constructor() {
        super();
        this.methods = new Map();
        this.sent = [];
        this.reported = [];
        this.twin = new EventEmitter();
        this.twin.properties = { desired: { qualified: true }, reported: { update: (patch, done) => { this.reported.push(patch); done(); } } };
        this.twin.on('newListener', (event) => {
            if (event === 'properties.desired') setImmediate(() => this.twin.emit(event, this.twin.properties.desired));
        });
    }
    setOptions(options, done) { done(); }
    open(done) { done(); }
    close(done) { done(); }
    getTwin(done) { done(null, this.twin); }
    sendOutputEvent(output, message, done) { this.sent.push({ output, payload: JSON.parse(message.getData().toString()) }); done(); }
    onMethod(name, handler) { assert.ok(!this.methods.has(name)); this.methods.set(name, handler); }
}

azure.ModuleClient.fromEnvironment = async () => { const client = new FakeClient(); clients.push(client); return client; };
azure.Client.fromConnectionString = () => { const client = new FakeClient(); devices.push(client); return client; };

async function main() {
    const cert = path.join(userDirectory, 'test-cert.pem');
    const key = path.join(userDirectory, 'test-key.pem');
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-subj', '/CN=test-device', '-days', '2'], { stdio: 'ignore' });
    Object.assign(process.env, {
        IOTEDGE_IOTHUBHOSTNAME: 'test.azure-devices.net', IOTEDGE_DEVICEID: 'test-device',
        PATH_TO_CERTIFICATE_FILE: cert, PATH_TO_KEY_FILE: key
    });
    const flow = installedRequire(`${packageName}/examples/${exampleFile}`);
    fs.writeFileSync(path.join(userDirectory, 'flows.json'), JSON.stringify(flow));
    RED.init({
        userDir: userDirectory, flowFile: 'flows.json', httpAdminRoot: false,
        httpNodeRoot: false, credentialSecret: 'disposable-qualification-secret',
        logging: { console: { level: 'off' }, qualification: { level: 'trace', handler: () => (message) => logs.push(message) } }
    });
    RED.hooks.add('onReceive.example-check', (event) => {
        received.push({ id: event.destination.id, msg: RED.util.cloneMessage(event.msg) });
    });
    const started = new Promise((resolve) => RED.events.once('flows:started', resolve));
    await RED.start();
    await started;
    const expected = ['moduleclient', 'moduletwin', 'moduleinput', 'moduleoutput', 'modulemethod', 'device-client', 'device-twin'];
    for (const type of expected) assert.equal(typeof RED.nodes.getType(type), 'function', `${type} was not discovered`);
    const sets = RED.nodes.getNodeList().filter((entry) => entry.module === packageName);
    assert.equal(sets.length, 2, 'expected one discovered node set per runtime/editor pair');
    for (const entry of sets) assert.ok(!entry.err, JSON.stringify(entry));
    for (const node of flow.filter((node) => expected.includes(node.type))) assert.ok(RED.nodes.getNode(node.id), `${node.type} was not constructed`);
    const moduleOwner = flow.find((node) => node.type === 'moduleclient');
    if (moduleOwner) await waitFor(() => RED.nodes.getNode(moduleOwner.id)._moduleClientOwner.state === 'ready');
    const deviceOwner = flow.find((node) => node.type === 'device-client');
    if (deviceOwner) await waitFor(() => RED.nodes.getNode(deviceOwner.id).connected);
    for (const client of [...clients, ...devices]) {
        assert.equal(client.sent.length, 0, 'example sent telemetry automatically');
        assert.equal(client.reported.length, 0, 'example reported properties automatically');
    }

    for (const inject of flow.filter((node) => node.type === 'inject')) RED.nodes.getNode(inject.id).receive({});
    const output = flow.find((node) => node.type === 'moduleoutput' && node.output === 'output1');
    if (output) {
        await waitFor(() => clients[0].sent.some((send) => send.output === 'output1'));
        const sample = clients[0].sent.find((send) => send.output === 'output1').payload;
        assert.equal(typeof sample, 'object');
        if (exampleFile === '01-module-output.json') assert.deepEqual(sample, { temperature: 21.5, source: 'node-red' });
    }
    for (const twinNode of flow.filter((node) => ['moduletwin', 'device-twin'].includes(node.type))) {
        const client = twinNode.type === 'moduletwin' ? clients[0] : devices[0];
        await waitFor(() => client.reported.length > 0 && received.some((entry) => entry.msg.topic === 'desired'));
        if (twinNode.type === 'device-twin') assert.deepEqual(client.reported, [{ deviceStatus: 'running' }]);
        else assert.equal(client.reported[0].moduleStatus, 'running');
    }
    const method = flow.find((node) => node.type === 'modulemethod');
    if (method) {
        await waitFor(() => clients[0].methods.has(method.method));
        for (const payload of [{ value: 42 }, false, 0, '', null]) {
            let response;
            clients[0].methods.get(method.method)({ methodName: method.method, payload }, {
                send(status, body, done) { response = { status, body }; done(); }
            });
            await waitFor(() => response);
            assert.equal(typeof response.body, 'object', 'method body must not be a double-encoded string');
            // Function nodes create objects in a VM realm. Compare their JSON
            // wire values, not the realm-specific Object prototype.
            assert.deepEqual(JSON.parse(JSON.stringify(response)), { status: 200, body: { echo: payload } });
        }
    }
    const input = flow.find((node) => node.type === 'moduleinput');
    if (input) {
        for (const payload of [{ value: 42 }, [1, null], false, 0, '', 'hello', '{"literal":true}', null]) {
            const before = clients[0].sent.length;
            clients[0].emit('inputMessage', input.input, { getBytes: () => Buffer.from(JSON.stringify(payload)) });
            await waitFor(() => clients[0].sent.length > before);
            const send = clients[0].sent[before];
            assert.equal(send.output, 'output2');
            if (payload !== null && typeof payload === 'object' && !Array.isArray(payload)) {
                assert.equal(send.payload.value, 42);
                assert.ok(Number.isFinite(Date.parse(send.payload.forwardedAt)));
            } else assert.deepEqual(send.payload, payload);
        }
    }
    // Exercise the exported diagnostics, not just their JSON scope references.
    for (const complete of flow.filter((node) => node.type === 'complete')) {
        await waitFor(() => received.some((entry) => entry.id === complete.id && complete.scope.includes(entry.msg.complete?.source.id)));
    }
    for (const status of flow.filter((node) => node.type === 'status')) {
        await waitFor(() => received.some((entry) => entry.id === status.id && status.scope.includes(entry.msg.status?.source.id)));
    }
    for (const catcher of flow.filter((node) => node.type === 'catch')) {
        const target = catcher.scope.find((id) => ['moduleoutput', 'moduletwin', 'device-twin', 'modulemethod'].includes(flow.find((node) => node.id === id)?.type));
        assert.ok(target);
        RED.nodes.getNode(target).receive({ payload: 'not-json' });
        await waitFor(() => received.some((entry) => entry.id === catcher.id && entry.msg.error?.source.id === target));
    }
    await RED.stop();
    RED.hooks.remove('onReceive.example-check');
    const failures = logs.filter((message) => message.level <= 20);
    assert.deepEqual(failures, [], 'Node-RED logged errors during package discovery/deploy');
    console.log(`Installed Node-RED ${RED.version()}: ${exampleFile} discovery, flow behavior and diagnostics passed`);
}

main().catch((error) => { console.error(error); process.exit(1); });
