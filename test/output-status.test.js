'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const test = require('node:test');
const azure = require('azure-iot-device');
const { harness, flush } = require('./runtime-harness');

test('Module Output status follows connection, disconnect, recovery and close', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const clients = [];
    t.mock.method(azure.ModuleClient, 'fromEnvironment', async () => {
        const client = new EventEmitter();
        client.open = client.close = (done) => done();
        clients.push(client);
        return client;
    });
    const runtime = harness(require('../azure-iot-edge-module-client'));
    const owner = runtime.create('moduleclient', { id: 'owner' });
    const output = runtime.create('moduleoutput', { id: 'output', client: 'owner' });
    await flush();
    assert.equal(output.lastStatus.text, 'Connected');
    clients[0].emit('disconnect');
    await flush();
    assert.equal(output.lastStatus.text, 'Disconnected');
    t.mock.timers.tick(1000);
    await flush();
    assert.equal(output.lastStatus.text, 'Connected');
    await runtime.close(output);
    assert.equal(owner._moduleClientOwner.outputConsumers.size, 0);
    await runtime.close(owner);
    assert.equal(output.lastStatus.text, 'Disconnected');
});
