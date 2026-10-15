'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const test = require('node:test');
const azure = require('azure-iot-device');
const { harness, flush } = require('./runtime-harness');

test('new output cannot bypass close-before-reconnect while recovery is draining', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const clients = [];
    let finishClose;
    t.mock.method(azure.ModuleClient, 'fromEnvironment', async () => {
        const client = new EventEmitter();
        client.open = (done) => done();
        client.sendOutputEvent = (output, message, done) => done();
        client.close = (done) => {
            if (clients[0] === client) finishClose = done;
            else done();
        };
        clients.push(client);
        return client;
    });
    const runtime = harness(require('../azure-iot-edge-module-client'));
    const owner = runtime.create('moduleclient', { id: 'owner' });
    await flush();
    clients[0].emit('disconnect');
    const send = owner._moduleClientOwner.sendOutput('output', {});
    await flush();
    assert.equal(clients.length, 1);
    finishClose();
    await flush();
    t.mock.timers.tick(1000);
    await flush();
    assert.equal(clients.length, 2);
    await send;
    await runtime.close(owner);
});
