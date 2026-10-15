'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const test = require('node:test');
const azure = require('azure-iot-device');
const { harness, flush } = require('./runtime-harness');

test('method responses complete once even when all telemetry slots are occupied', async (t) => {
    const client = new EventEmitter();
    const sends = [];
    const methods = new Map();
    client.open = client.close = (done) => done();
    client.sendOutputEvent = (output, message, done) => sends.push(done);
    client.onMethod = (name, handler) => methods.set(name, handler);
    t.mock.method(azure.ModuleClient, 'fromEnvironment', async () => client);
    const runtime = harness(require('../azure-iot-edge-module-client'));
    const owner = runtime.create('moduleclient', { id: 'owner' });
    const method = runtime.create('modulemethod', { id: 'method', client: 'owner', method: 'test' });
    await flush();
    const operations = Array.from({ length: 100 }, () => owner._moduleClientOwner.sendOutput('output', {}));
    await flush();
    assert.equal(sends.length, 100);
    let response;
    methods.get('test')({ payload: {}, methodName: 'test' }, { send: (status, payload, done) => { response = { status, payload }; done(); } });
    const request = { ...method.messages[0], status: 200, payload: { ok: true } };
    const completions = [];
    method.emit('input', request, null, (error) => completions.push(error));
    await flush();
    assert.deepEqual(response, { status: 200, payload: { ok: true } });
    assert.deepEqual(completions, [undefined]);
    assert.equal(owner._moduleClientOwner.pendingMethods.size, 0);
    for (const done of sends) done();
    await Promise.all(operations);
    await runtime.close(method);
    await runtime.close(owner);
});

test('response-pool saturation retains the request until capacity is available', async (t) => {
    const client = new EventEmitter();
    const responses = [];
    let handler;
    client.open = client.close = (done) => done();
    client.onMethod = (name, callback) => { handler = callback; };
    t.mock.method(azure.ModuleClient, 'fromEnvironment', async () => client);
    const runtime = harness(require('../azure-iot-edge-module-client'));
    const owner = runtime.create('moduleclient', { id: 'owner' });
    const method = runtime.create('modulemethod', { id: 'method', client: 'owner', method: 'test' });
    await flush();
    const completions = [];
    for (let i = 0; i < 100; i += 1) {
        handler({ payload: i }, { send: (status, payload, done) => responses.push(done) });
        method.emit('input', { ...method.messages[i], status: 200 }, null, (error) => completions.push(error));
    }
    await flush();
    handler({ payload: 'retained' }, { send: (status, payload, done) => { responses.push(done); done(); } });
    const request = { ...method.messages[100], status: 200 };
    let rejected;
    method.emit('input', request, null, (error) => { rejected = error; });
    await flush();
    assert.match(rejected.message, /method response limit/);
    assert.equal(owner._moduleClientOwner.pendingMethods.size, 1);
    for (const done of responses) done();
    await flush();
    assert.equal(completions.length, 100);
    assert.ok(completions.every((error) => error === undefined));
    let completed = 0;
    method.emit('input', request, null, (error) => { assert.ifError(error); completed += 1; });
    await flush();
    assert.equal(completed, 1);
    assert.equal(owner._moduleClientOwner.pendingMethods.size, 0);
    await runtime.close(method);
    await runtime.close(owner);
});
