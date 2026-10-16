'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { readArchive } = require('../scripts/package-archive');

const root = path.resolve(__dirname, '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'iot-package-migration-'));
const oldName = 'node-red-contrib-azure-iot-edge-kpm';
const manifest = require('../package.json');
const baselineHash = 'd4c3f64ffc9789b3ec4cd029c7f69711b978812d48672c2b9f149755c8f928ef';
const baselineCommit = 'f62530dfe2bd1ed1a7b3557fa7a9ced353b0de87';
const baselineFile = `${oldName}-1.0.0-rc.2.tgz`;

function npm(args, cwd) {
    const executable = process.env.npm_execpath;
    return execFileSync(executable ? process.execPath : 'npm', executable ? [executable, ...args] : args, { cwd, encoding: 'utf8', timeout: 180000 });
}

function pack(cwd, destination) {
    return path.join(destination, JSON.parse(npm(['pack', '--ignore-scripts', '--json', '--pack-destination', destination], cwd))[0].filename);
}

function baseline() {
    const local = process.env.LEGACY_PACKAGE_TARBALL || path.join(root, 'dist', baselineFile);
    let archive = path.resolve(local);
    if (!fs.existsSync(archive) || process.env.RECONSTRUCT_LEGACY_BASELINE === '1') {
        assert.ok(!process.env.LEGACY_PACKAGE_TARBALL, 'explicit baseline artifact does not exist');
        // CI does not commit binaries. Reconstruct from its original source and
        // require the exact recorded artifact hash, not merely equivalent code.
        const source = path.join(temporary, 'baseline-source');
        fs.mkdirSync(source);
        const sourceArchive = path.join(temporary, 'baseline-source.tar.gz');
        fs.writeFileSync(sourceArchive, execFileSync('git', ['archive', '--format=tar.gz', baselineCommit], { cwd: root }));
        execFileSync('tar', ['-xzf', sourceArchive, '-C', source]);
        archive = pack(source, temporary);
        console.log(`Reconstructed rc.2 from ${baselineCommit}; verifying exact baseline hash`);
    }
    assert.equal(createHash('sha256').update(fs.readFileSync(archive)).digest('hex'), baselineHash, 'rc.2 baseline artifact hash mismatch');
    return archive;
}

function runPhase(directory, name, absent, phase) {
    console.log(execFileSync(process.execPath, [path.join(__dirname, 'fixtures/migration-runtime.js'), directory, name, absent], {
        cwd: directory, encoding: 'utf8', timeout: 30000
    }));
    const lock = JSON.parse(fs.readFileSync(path.join(directory, 'package-lock.json')));
    assert.ok(lock.packages[`node_modules/${name}`], `${phase}: expected installed package in lock`);
    assert.ok(!lock.packages[`node_modules/${absent}`], `${phase}: old competing owner remains in lock`);
    console.log(`${phase}: only ${name} owns the existing flow types`);
}

try {
    const oldArchive = baseline();
    const newArchive = process.argv[2] ? path.resolve(process.argv[2]) : pack(root, temporary);
    const oldEntries = readArchive(oldArchive);
    const newEntries = readArchive(newArchive);
    const packed = JSON.parse(newEntries.get('package/package.json'));
    assert.equal(packed.name, manifest.name);
    assert.equal(packed.version, manifest.version);
    assert.equal(packed.publishConfig.access, 'public');
    for (const file of [...Object.values(manifest['node-red'].nodes), 'azure-iot-edge-module-client.html', 'azure-iot-edge-device-client.html', 'lib/supervised-mqtt.js']) {
        assert.deepEqual(newEntries.get(`package/${file}`), oldEntries.get(`package/${file}`), `runtime contract changed: ${file}`);
    }
    const user = path.join(temporary, 'user');
    fs.mkdirSync(user);
    const app = { private: true, dependencies: { [oldName]: `file:${oldArchive}` }, devDependencies: { 'node-red': process.env.NODE_RED_TEST_VERSION || manifest.devDependencies['node-red'] } };
    const appPath = path.join(user, 'package.json');
    const lockPath = path.join(user, 'package-lock.json');
    const flowPath = path.join(user, 'flows.json');
    const flow = JSON.parse(oldEntries.get('package/examples/example.json'));
    if (!flow.some((node) => node.type === 'tab')) flow.unshift({ id: '57138478.e2855c', type: 'tab', label: 'Existing rc.2 flow' });
    for (const node of flow.filter((node) => node.type === 'inject')) { node.once = false; node.repeat = ''; }
    flow.push(
        { id: 'migration-device-owner', type: 'device-client' },
        { id: 'migration-device-twin', type: 'device-twin', client: 'migration-device-owner', z: '57138478.e2855c', x: 100, y: 900, wires: [] }
    );
    const snapshot = JSON.stringify(flow);
    fs.writeFileSync(flowPath, snapshot);
    fs.writeFileSync(appPath, JSON.stringify(app, null, 2));
    console.log(npm(['install', '--ignore-scripts', '--no-audit', '--no-fund', '--registry=https://registry.npmjs.org/'], user));
    const originalManifest = fs.readFileSync(appPath);
    const originalLock = fs.readFileSync(lockPath);
    runPhase(user, oldName, manifest.name, 'baseline');
    assert.equal(fs.readFileSync(flowPath, 'utf8'), snapshot);

    delete app.dependencies[oldName];
    app.dependencies[manifest.name] = `file:${newArchive}`;
    fs.writeFileSync(appPath, JSON.stringify(app, null, 2));
    console.log(npm(['install', '--ignore-scripts', '--no-audit', '--no-fund', '--registry=https://registry.npmjs.org/'], user));
    runPhase(user, manifest.name, oldName, 'scoped upgrade');
    assert.equal(fs.readFileSync(flowPath, 'utf8'), snapshot, 'upgrade modified existing flow');

    fs.writeFileSync(appPath, originalManifest);
    fs.writeFileSync(lockPath, originalLock);
    fs.writeFileSync(flowPath, snapshot);
    console.log(npm(['ci', '--ignore-scripts', '--no-audit', '--no-fund', '--registry=https://registry.npmjs.org/'], user));
    runPhase(user, oldName, manifest.name, 'rollback');
    assert.equal(fs.readFileSync(flowPath, 'utf8'), snapshot, 'rollback modified existing flow');
    console.log('Original rc.2 → scoped candidate → original rc.2 passed without rewiring or registry-cache edits');
} finally {
    fs.rmSync(temporary, { recursive: true, force: true });
}
