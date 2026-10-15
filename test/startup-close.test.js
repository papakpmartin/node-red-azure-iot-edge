'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const azure = require('azure-iot-device');
const { harness, flush } = require('./runtime-harness');

for (const kind of ['module', 'device']) {
    for (const failure of ['failed', 'hung']) {
        test(`${kind} startup does not replace a client after ${failure} close`, async (t) => {
            t.mock.timers.enable({ apis: ['setTimeout'] });
            const clients = [];
            const factory = () => {
                const client = new EventEmitter();
                client.setOptions = (options, done) => done();
                client.open = (done) => done(new Error('injected open failure'));
                client.close = (done) => {
                    if (failure === 'failed') done(new Error('injected close failure'));
                };
                clients.push(client);
                return client;
            };
            if (kind === 'module') {
                t.mock.method(azure.ModuleClient, 'fromEnvironment', async () => factory());
            } else {
                const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'iot-close-test-'));
                t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
                const cert = path.join(directory, 'cert.pem');
                const key = path.join(directory, 'key.pem');
                execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-subj', '/CN=test-device', '-days', '2'], { stdio: 'ignore' });
                const values = { IOTEDGE_IOTHUBHOSTNAME: 'test.azure-devices.net', IOTEDGE_DEVICEID: 'test-device', PATH_TO_CERTIFICATE_FILE: cert, PATH_TO_KEY_FILE: key };
                for (const [name, value] of Object.entries(values)) {
                    const original = process.env[name];
                    process.env[name] = value;
                    t.after(() => { if (original === undefined) delete process.env[name]; else process.env[name] = original; });
                }
                t.mock.method(azure.Client, 'fromConnectionString', factory);
            }
            const runtime = harness(require(`../azure-iot-edge-${kind}-client`));
            const owner = runtime.create(kind === 'module' ? 'moduleclient' : 'device-client', { id: 'owner' });
            // Device startup reads generated certificate files asynchronously.
            for (let i = 0; i < 100 && clients.length === 0; i += 1) await flush();
            assert.equal(clients.length, 1);
            await flush();
            if (failure === 'hung') {
                t.mock.timers.tick(10001);
                await flush();
            }
            t.mock.timers.tick(60000);
            await flush();
            assert.equal(clients.length, 1);
            assert.ok(clients[0].listenerCount('error') > 0);
            clients[0].emit('error', new Error('late client error'));
            if (kind === 'module') {
                await assert.rejects(owner._moduleClientOwner.sendOutput('output', {}), /restart Node-RED/);
            } else {
                await assert.rejects(owner.updateReportedProperties({}), /restart Node-RED/);
            }
            assert.equal(clients.length, 1, 'new input must not restart an unsafe owner');
            await runtime.close(owner);
            assert.ok(clients[0].listenerCount('error') > 0, 'shutdown must preserve uncertain-client error protection');
        });
    }
}
