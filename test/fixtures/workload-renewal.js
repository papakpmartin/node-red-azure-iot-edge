'use strict';

// Run in a subprocess: an unhandled provider error must fail the test, not be
// hidden by the test runner. This is a real SDK/local workload API test, not Azure.
const assert = require('node:assert/strict');
const http = require('node:http');
const { ModuleClient } = require('azure-iot-device');
const { Mqtt } = require('azure-iot-device-mqtt');
const supervisedMqtt = require('../../lib/supervised-mqtt');

let failSigning = false;
let provider;
let failures = 0;
const server = http.createServer((request, response) => {
    request.resume();
    request.on('end', () => {
        response.setHeader('Content-Type', 'application/json');
        if (request.method === 'GET') {
            response.end(JSON.stringify({ certificate: 'test-only trust bundle' }));
        } else if (failSigning) {
            response.statusCode = 503;
            response.end(JSON.stringify({ message: 'injected signing outage' }));
        } else {
            response.end(JSON.stringify({ digest: Buffer.from('test-only signature').toString('base64') }));
        }
    });
});

class CapturingMqtt extends Mqtt {
    constructor(authenticationProvider) {
        super(authenticationProvider);
        provider = authenticationProvider;
    }
}

async function main() {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    delete process.env.EdgeHubConnectionString;
    delete process.env.IotHubConnectionString;
    Object.assign(process.env, {
        IOTEDGE_WORKLOADURI: `http://127.0.0.1:${server.address().port}`,
        IOTEDGE_DEVICEID: 'test-device', IOTEDGE_MODULEID: 'test-module',
        IOTEDGE_MODULEGENERATIONID: '1', IOTEDGE_IOTHUBHOSTNAME: 'test.azure-devices.net',
        IOTEDGE_AUTHSCHEME: 'sasToken'
    });
    let signalFailure;
    const failure = new Promise((resolve) => { signalFailure = resolve; });
    const Transport = supervisedMqtt(CapturingMqtt, (error) => {
        failures += 1;
        signalFailure(error);
    });
    const client = await ModuleClient.fromEnvironment(Transport);
    client.on('error', (error) => { throw error; });
    assert.equal(provider.listenerCount('error'), 1);
    provider.setTokenRenewalValues(2, 1);
    await provider.getDeviceCredentials();
    failSigning = true;
    const error = await failure;
    assert.match(error.message, /injected signing outage/);
    assert.equal(failures, 1);
    await client.close();

    // Recreating through the original SDK factory obtains fresh signing/trust.
    failSigning = false;
    const replacement = await ModuleClient.fromEnvironment(Transport);
    provider.setTokenRenewalValues(2, 1);
    await provider.getDeviceCredentials();
    provider.stop();
    await replacement.close();
    await new Promise((resolve) => server.close(resolve));
    console.log('SDK renewal failure contained; replacement signing succeeded');
}

const watchdog = setTimeout(() => process.exit(2), 8000);
main().then(() => clearTimeout(watchdog), (error) => {
    console.error(error);
    process.exit(1);
});
