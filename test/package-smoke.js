'use strict';

const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { readArchive } = require('../scripts/package-archive');

const root = path.resolve(__dirname, '..');
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'azure-iot-package-'));

function npm(args, options = {}) {
    const executable = process.env.npm_execpath;
    return childProcess.execFileSync(executable ? process.execPath : 'npm', executable ? [executable, ...args] : args, {
        encoding: 'utf8', timeout: 180000, ...options
    });
}

try {
    const archivePath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(temporaryDirectory, JSON.parse(npm(
        ['pack', '--json', '--ignore-scripts', '--pack-destination', temporaryDirectory], { cwd: root }
    ))[0].filename);
    const entries = readArchive(archivePath);
    const files = new Set(Array.from(entries.keys(), (name) => name.replace(/^package\//, '')));
    const packedManifest = JSON.parse(entries.get('package/package.json'));
    const exampleFiles = fs.readdirSync(path.join(root, 'examples')).filter((file) => file.endsWith('.json')).sort();
    const required = [
        'LICENSE.md',
        'CHANGELOG.md',
        'README.md',
        'azure-iot-edge-device-client.html',
        'azure-iot-edge-device-client.js',
        'azure-iot-edge-module-client.html',
        'azure-iot-edge-module-client.js',
        'lib/supervised-mqtt.js',
        'icons/iot-edge-module-logo.svg',
        'docs/dependency-risk.md',
        'docs/release-validation.md',
        ...exampleFiles.map((file) => `examples/${file}`),
        'package.json'
    ];

    for (const file of required) {
        assert.ok(files.has(file), `${file} is missing from the npm package`);
    }
    assert.ok(!files.has('azure-iot-edge-config.js'), 'obsolete config runtime was packaged');
    assert.ok(!files.has('docs/modernization-plan.md'), 'historical internal proposal was packaged');
    assert.ok(!Array.from(files).some((file) => file.startsWith('test/')), 'test files were packaged');
    assert.ok(!Array.from(files).some((file) => file.startsWith('todo/')), 'internal todo files were packaged');
    assert.ok(!Array.from(files).some((file) => file.startsWith('scripts/') || file.startsWith('dist/')), 'release tooling or output was packaged');
    assert.ok(!Array.from(files).some((file) => file.endsWith('.tgz')), 'nested npm tarball was packaged');

    const nodeEntries = packedManifest['node-red'].nodes;
    const runtimePaths = Object.values(nodeEntries);
    assert.deepEqual(nodeEntries, {
        'Azure IoT Edge Module Client': 'azure-iot-edge-module-client.js',
        'Azure IoT Edge Device Client': 'azure-iot-edge-device-client.js'
    });
    assert.equal(
        new Set(runtimePaths).size,
        runtimePaths.length,
        'the packed manifest declares a Node-RED entry point more than once'
    );

    // A library lockfile is not used by consumers. Resolve a fresh installation
    // and make Node-RED discover/deploy it, rather than loading source by hand.
    const userDirectory = path.join(temporaryDirectory, 'user');
    fs.mkdirSync(userDirectory);
    fs.writeFileSync(path.join(userDirectory, 'package.json'), JSON.stringify({
        private: true,
        dependencies: { [packedManifest.name]: `file:${archivePath}` },
        devDependencies: { 'node-red': process.env.NODE_RED_TEST_VERSION || require('../package.json').devDependencies['node-red'] }
    }));
    console.log(npm(['install', '--ignore-scripts', '--no-audit', '--no-fund', '--registry=https://registry.npmjs.org/'], { cwd: userDirectory }));
    for (const file of exampleFiles) {
        console.log(childProcess.execFileSync(process.execPath, [path.join(__dirname, 'fixtures/packed-discovery.js'), userDirectory, file, packedManifest.name], {
            cwd: userDirectory, encoding: 'utf8', timeout: 30000
        }));
    }
    let audit;
    try {
        audit = npm(['audit', '--omit=dev', '--json'], { cwd: userDirectory });
    } catch (error) {
        if (error.status !== 1) throw error;
        audit = error.stdout;
    }
    const report = JSON.parse(audit);
    assert.ok(report.metadata, 'consumer audit failed without an advisory report');
    assert.equal(report.metadata.vulnerabilities.high, 0, 'fresh consumer has high production advisories');
    assert.equal(report.metadata.vulnerabilities.critical, 0, 'fresh consumer has critical production advisories');
    console.log('Fresh-consumer production audit:', report.metadata.vulnerabilities);
} finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
