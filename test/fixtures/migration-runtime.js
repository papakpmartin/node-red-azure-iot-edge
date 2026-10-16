'use strict';

// Exercise the same legacy flow, with its original method name and Function
// bodies, before upgrade, after upgrade, and after rollback in real Node-RED.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { createRequire } = require('node:module');
const { execFileSync } = require('node:child_process');
const [user, packageName, absent] = process.argv.slice(2);
const installedRequire = createRequire(path.join(user, 'package.json'));
const RED = installedRequire('node-red');
const azure = installedRequire('azure-iot-device');
const moduleClients = [];
const deviceClients = [];
const errors = [];

class FakeClient extends EventEmitter {
    constructor() {
        super(); this.methods = new Map(); this.sent = []; this.reported = [];
        this.twin = new EventEmitter();
        this.twin.properties = { desired: { existing: true }, reported: { update: (patch, done) => { this.reported.push(patch); done(); } } };
        this.twin.on('newListener', (event) => { if (event === 'properties.desired') setImmediate(() => this.twin.emit(event, this.twin.properties.desired)); });
    }
    open(done) { done(); }
    close(done) { done(); }
    setOptions(options, done) { done(); }
    getTwin(done) { done(null, this.twin); }
    onMethod(name, handler) { assert.ok(!this.methods.has(name)); this.methods.set(name, handler); }
    sendOutputEvent(output, message, done) { this.sent.push({ output, payload: JSON.parse(message.getData().toString()) }); done(); }
}

async function waitFor(predicate) {
    const deadline = Date.now() + 5000;
    while (!predicate()) { assert.ok(Date.now() < deadline, 'legacy flow did not become ready'); await new Promise((resolve) => setTimeout(resolve, 5)); }
}

async function main() {
    assert.equal(installedRequire(`${packageName}/package.json`).name, packageName);
    assert.throws(() => installedRequire.resolve(`${absent}/package.json`), { code: 'MODULE_NOT_FOUND' });
    azure.ModuleClient.fromEnvironment = async () => { const client = new FakeClient(); moduleClients.push(client); return client; };
    azure.Client.fromConnectionString = () => { const client = new FakeClient(); deviceClients.push(client); return client; };
    const cert = path.join(user, 'test-cert.pem');
    const key = path.join(user, 'test-key.pem');
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-subj', '/CN=test-device', '-days', '2'], { stdio: 'ignore' });
    Object.assign(process.env, { IOTEDGE_IOTHUBHOSTNAME: 'test.azure-devices.net', IOTEDGE_DEVICEID: 'test-device', PATH_TO_CERTIFICATE_FILE: cert, PATH_TO_KEY_FILE: key });
    const flowPath = path.join(user, 'flows.json');
    const original = fs.readFileSync(flowPath, 'utf8');
    const flow = JSON.parse(original);
    RED.init({ userDir: user, flowFile: 'flows.json', httpAdminRoot: false, httpNodeRoot: false, credentialSecret: 'migration-fixture-only', logging: { console: { level: 'off' }, migration: { level: 'error', handler: () => (entry) => errors.push(entry) } } });
    const started = new Promise((resolve) => RED.events.once('flows:started', resolve));
    await RED.start(); await started;
    const types = ['moduleclient', 'moduleinput', 'moduleoutput', 'moduletwin', 'modulemethod', 'device-client', 'device-twin'];
    for (const definition of flow.filter((node) => types.includes(node.type))) {
        const instance = RED.nodes.getNode(definition.id);
        assert.ok(instance, `missing existing node: ${definition.id}`);
        assert.equal(instance.type, definition.type);
        if (definition.wires) assert.deepEqual(instance.wires, definition.wires);
        if (definition.client) assert.ok(RED.nodes.getNode(definition.client), 'existing configuration reference was lost');
    }
    const registry = RED.nodes.getNodeList();
    assert.equal(registry.filter((entry) => entry.module === packageName).length, 2);
    assert.equal(registry.filter((entry) => entry.module === absent).length, 0, 'competing package remains in registry');
    await waitFor(() => moduleClients[0]?.methods.has('setValue') && RED.nodes.getNode('migration-device-owner').connected);
    for (const node of flow.filter((node) => node.type === 'inject')) RED.nodes.getNode(node.id).receive({});
    await waitFor(() => moduleClients[0].sent.length > 0 && moduleClients[0].reported.length > 0);
    assert.equal(moduleClients[0].sent[0].output, 'output1');
    assert.equal(moduleClients[0].sent[0].payload.deviceId, 'device-01');
    const method = flow.find((node) => node.type === 'modulemethod');
    assert.equal(method.method, 'setValue', 'the legacy configured method name must not be migrated');
    let response;
    moduleClients[0].methods.get(method.method)({ methodName: method.method, payload: { legacy: true } }, {
        send(status, payload, done) { response = { status, payload }; done(); }
    });
    await waitFor(() => response);
    assert.equal(response.status, 200);
    assert.deepEqual(response.payload.methodPayload, { legacy: true });
    const input = flow.find((node) => node.type === 'moduleinput');
    const before = moduleClients[0].sent.length;
    moduleClients[0].emit('inputMessage', input.input, { getBytes: () => Buffer.from('{"value":42}') });
    await waitFor(() => moduleClients[0].sent.length > before);
    assert.equal(moduleClients[0].sent[before].output, 'output2');
    assert.equal(moduleClients[0].sent[before].payload.value, 42);
    RED.nodes.getNode('migration-device-twin').receive({ payload: { migration: 'verified' } });
    await waitFor(() => deviceClients[0].reported.length > 0);
    assert.deepEqual(deviceClients[0].reported[0], { migration: 'verified' });
    await RED.stop();
    assert.equal(fs.readFileSync(flowPath, 'utf8'), original);
    assert.deepEqual(errors, [], 'legacy flow logged registration/runtime errors');
    console.log(`Node-RED ${RED.version()}: unchanged legacy IDs, config references, wires, twins, routes and setValue method passed`);
}

main().catch((error) => { console.error(error); process.exit(1); });
