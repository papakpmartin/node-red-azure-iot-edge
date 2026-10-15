'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

module.exports = function deviceFixture(t) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'iot-device-fixture-'));
    const cert = path.join(directory, 'cert.pem');
    const key = path.join(directory, 'key.pem');
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-subj', '/CN=test-device', '-days', '2'], { stdio: 'ignore' });
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    for (const [name, value] of Object.entries({
        IOTEDGE_IOTHUBHOSTNAME: 'test.azure-devices.net', IOTEDGE_DEVICEID: 'test-device',
        PATH_TO_CERTIFICATE_FILE: cert, PATH_TO_KEY_FILE: key
    })) {
        const original = process.env[name];
        process.env[name] = value;
        t.after(() => { if (original === undefined) delete process.env[name]; else process.env[name] = original; });
    }
};
