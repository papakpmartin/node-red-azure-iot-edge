'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');
const azure = require('azure-iot-device');
const { harness, flush } = require('./runtime-harness');

test('real SDK workload renewal error is contained in a subprocess', () => {
    const result = spawnSync(process.execPath, [path.join(__dirname, 'fixtures/workload-renewal.js')], { encoding: 'utf8', timeout: 12000 });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    assert.match(result.stdout, /replacement signing succeeded/);
});

for (const duringOpen of [false, true]) {
    test(`owner recovers from authentication failure ${duringOpen ? 'during open' : 'after ready'}`, async (t) => {
        t.mock.timers.enable({ apis: ['setTimeout'] });
        const clients = [];
        let failAuthentication;
        t.mock.method(azure.ModuleClient, 'fromEnvironment', async (Transport) => {
            const provider = new EventEmitter();
            provider.type = 0; // No token setup needed for this owner-only fake.
            new Transport(provider);
            failAuthentication = (error) => provider.emit('error', error);
            const client = new EventEmitter();
            client.open = (done) => {
                if (duringOpen && clients.length === 1) failAuthentication(new Error('signing outage'));
                else done();
            };
            client.close = (done) => { client.closed = true; done(); };
            clients.push(client);
            return client;
        });
        const runtime = harness(require('../azure-iot-edge-module-client'));
        const node = runtime.create('moduleclient', { id: 'owner' });
        await flush();
        assert.equal(clients.length, 1);
        if (!duringOpen) failAuthentication(new Error('signing outage'));
        await flush();
        assert.equal(clients[0].closed, true);
        t.mock.timers.tick(1000);
        await flush();
        assert.equal(clients.length, 2);
        assert.equal(node._moduleClientOwner.state, 'ready');
        await runtime.close(node);
        failAuthentication(new Error('late signing failure after close'));
        t.mock.timers.tick(30000);
        await flush();
        assert.equal(clients.length, 2);
    });
}
