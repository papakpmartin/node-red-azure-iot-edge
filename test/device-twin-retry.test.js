'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const test = require('node:test');
const azure = require('azure-iot-device');
const deviceFixture = require('./device-fixture');
const { harness, flush } = require('./runtime-harness');

for (const shutdown of [false, true]) {
    test(`passive device twin ${shutdown ? 'cancels retries on close' : 'retries a transient initialization failure'}`, async (t) => {
        deviceFixture(t);
        t.mock.timers.enable({ apis: ['setTimeout'] });
        const client = new EventEmitter();
        const twin = new EventEmitter();
        twin.properties = { desired: { value: 42 } };
        let twinCalls = 0;
        client.setOptions = (options, done) => done();
        client.open = client.close = (done) => done();
        client.getTwin = (done) => {
            twinCalls += 1;
            if (twinCalls === 1) done(new Error('transient twin failure'));
            else done(null, twin);
        };
        t.mock.method(azure.Client, 'fromConnectionString', () => client);
        const runtime = harness(require('../azure-iot-edge-device-client'));
        const owner = runtime.create('device-client', { id: 'owner' });
        const child = runtime.create('device-twin', { id: 'twin', client: 'owner' });
        for (let i = 0; i < 100 && twinCalls === 0; i += 1) await flush();
        assert.equal(twinCalls, 1);
        await flush();
        if (shutdown) await runtime.close(child);
        t.mock.timers.tick(1000);
        await flush();
        assert.equal(twinCalls, shutdown ? 1 : 2);
        if (!shutdown) {
            twin.emit('properties.desired', twin.properties.desired);
            assert.deepEqual(child.messages, [{ payload: { value: 42 }, topic: 'desired' }]);
            await runtime.close(child);
        }
        await runtime.close(owner);
        t.mock.timers.tick(60000);
        await flush();
        assert.equal(twinCalls, shutdown ? 1 : 2);
    });
}
