'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const userDirectory = process.argv[2];
const installedRequire = createRequire(path.join(userDirectory, 'package.json'));
const RED = installedRequire('node-red');
const azure = installedRequire('azure-iot-device');
const logs = [];
const clients = [];
let methodResponse;

async function waitFor(predicate) {
    const deadline = Date.now() + 5000;
    while (!predicate()) {
        assert.ok(Date.now() < deadline, 'packed flow did not become ready');
        await new Promise((resolve) => setTimeout(resolve, 5));
    }
}

class FakeClient extends EventEmitter {
    constructor() {
        super();
        this.methods = new Map();
        this.twin = new EventEmitter();
        this.twin.properties = { desired: { qualified: true }, reported: { update: (patch, done) => done() } };
    }
    setOptions(options, done) { done(); }
    open(done) { done(); }
    close(done) { done(); }
    getTwin(done) { done(null, this.twin); }
    sendOutputEvent(output, message, done) { done(); }
    onMethod(name, handler) { assert.ok(!this.methods.has(name)); this.methods.set(name, handler); }
}

azure.ModuleClient.fromEnvironment = async () => { const client = new FakeClient(); clients.push(client); return client; };
azure.Client.fromConnectionString = () => new FakeClient();

async function main() {
    const cert = path.join(userDirectory, 'test-cert.pem');
    const key = path.join(userDirectory, 'test-key.pem');
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-subj', '/CN=test-device', '-days', '2'], { stdio: 'ignore' });
    Object.assign(process.env, {
        IOTEDGE_IOTHUBHOSTNAME: 'test.azure-devices.net', IOTEDGE_DEVICEID: 'test-device',
        PATH_TO_CERTIFICATE_FILE: cert, PATH_TO_KEY_FILE: key
    });
    const example = installedRequire('node-red-contrib-azure-iot-edge-kpm/examples/example.json');
    const flow = [
        { id: 'qualification-tab', type: 'tab', label: 'Package qualification' },
        ...example.map((node) => node.type === 'moduleclient' ? { ...node, z: undefined } : { ...node, z: 'qualification-tab' }),
        { id: 'device-owner', type: 'device-client' },
        { id: 'qualification-device-twin', type: 'device-twin', client: 'device-owner', z: 'qualification-tab', x: 200, y: 200, wires: [] }
    ];
    fs.writeFileSync(path.join(userDirectory, 'flows.json'), JSON.stringify(flow));
    RED.init({
        userDir: userDirectory, flowFile: 'flows.json', httpAdminRoot: false,
        httpNodeRoot: false, credentialSecret: 'disposable-qualification-secret',
        logging: { console: { level: 'off' }, qualification: { level: 'trace', handler: () => (message) => logs.push(message) } }
    });
    const started = new Promise((resolve) => RED.events.once('flows:started', resolve));
    await RED.start();
    await started;
    const expected = ['moduleclient', 'moduletwin', 'moduleinput', 'moduleoutput', 'modulemethod', 'device-client', 'device-twin'];
    for (const type of expected) assert.equal(typeof RED.nodes.getType(type), 'function', `${type} was not discovered`);
    const sets = RED.nodes.getNodeList().filter((entry) => entry.module === 'node-red-contrib-azure-iot-edge-kpm');
    assert.equal(sets.length, 2, 'expected one discovered node set per runtime/editor pair');
    for (const entry of sets) assert.ok(!entry.err, JSON.stringify(entry));
    for (const node of flow.filter((node) => expected.includes(node.type))) assert.ok(RED.nodes.getNode(node.id), `${node.type} was not constructed`);
    await waitFor(() => clients[0]?.methods.has('setValue') && RED.nodes.getNode('device-owner').connected);
    clients[0].methods.get('setValue')({ methodName: 'setValue', payload: { test: true } }, {
        send(status, payload, done) { methodResponse = { status, payload }; done(); }
    });
    await waitFor(() => methodResponse);
    assert.equal(methodResponse?.status, 200, 'bundled method example did not respond');
    assert.deepEqual(methodResponse.payload.methodPayload, { test: true });
    await RED.stop();
    const failures = logs.filter((message) => message.level <= 20);
    assert.deepEqual(failures, [], 'Node-RED logged errors during package discovery/deploy');
    console.log(`Installed Node-RED ${RED.version()}: two node sets, seven types, example method round-trip passed`);
}

main().catch((error) => { console.error(error); process.exit(1); });
