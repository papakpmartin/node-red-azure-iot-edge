'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { readArchive } = require('./package-archive');

function validateRelease(manifest, lock, packed, tag, prerelease) {
    assert.match(manifest.version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/, 'invalid release version');
    assert.equal(tag, `v${manifest.version}`, 'release tag must be v followed by the exact package version');
    assert.equal(lock.name, manifest.name);
    assert.equal(lock.version, manifest.version, 'lockfile version mismatch');
    assert.equal(lock.packages[''].version, manifest.version, 'root lockfile version mismatch');
    if (packed) {
        assert.equal(packed.name, manifest.name, 'packed package name mismatch');
        assert.equal(packed.version, manifest.version, 'packed package version mismatch');
    }
    const isPrerelease = manifest.version.includes('-');
    if (prerelease !== undefined) assert.equal(prerelease, isPrerelease, 'GitHub prerelease flag disagrees with package version');
    return isPrerelease ? 'next' : 'latest';
}

async function assertAvailable(name, version, request = fetch) {
    const response = await request(`https://registry.npmjs.org/${encodeURIComponent(name)}/${encodeURIComponent(version)}`, { signal: AbortSignal.timeout(30000) });
    if (response.status === 404) return;
    if (response.status === 200) throw new Error(`${name}@${version} already exists on npm; do not overwrite or republish`);
    throw new Error(`Unable to verify npm version availability: HTTP ${response.status}`);
}

async function main() {
    const root = path.resolve(__dirname, '..');
    const manifest = require('../package.json');
    const lock = require('../package-lock.json');
    const filename = `${manifest.name}-${manifest.version}.tgz`;
    let archive;
    let packed;
    if (process.argv[2]) {
        const target = path.resolve(process.argv[2]);
        if (fs.statSync(target).isDirectory()) {
            assert.deepEqual(fs.readdirSync(target).filter((file) => file.endsWith('.tgz')), [filename], 'expected exactly one release tarball');
            archive = path.join(target, filename);
        } else {
            archive = target;
        }
        assert.equal(path.basename(archive), filename, 'unexpected release tarball filename');
        const entries = readArchive(archive);
        packed = JSON.parse(entries.get('package/package.json'));
        const checksum = createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
        assert.equal(fs.readFileSync(`${archive}.sha256`, 'utf8').trim(), `${checksum}  ${filename}`, 'tarball checksum mismatch');
        for (const runtime of Object.values(manifest['node-red'].nodes)) {
            for (const file of [runtime, runtime.replace(/\.js$/, '.html')]) assert.deepEqual(entries.get(`package/${file}`), fs.readFileSync(path.join(root, file)), `${file} differs from checkout`);
        }
        assert.deepEqual(entries.get('package/lib/supervised-mqtt.js'), fs.readFileSync(path.join(root, 'lib/supervised-mqtt.js')));
    }
    const prerelease = process.env.RELEASE_PRERELEASE;
    if (prerelease !== undefined) assert.ok(['true', 'false'].includes(prerelease));
    const tag = validateRelease(manifest, lock, packed, process.env.RELEASE_TAG, prerelease === undefined ? undefined : prerelease === 'true');
    if (process.env.CHECK_NPM_VERSION === '1') await assertAvailable(manifest.name, manifest.version);
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${manifest.version}\nfilename=${filename}\ndist_tag=${tag}\n`);
    console.log(`Release checks passed: ${manifest.name}@${manifest.version}, dist-tag ${tag}${archive ? ', checksum and packed runtime verified' : ''}`);
}

module.exports = { validateRelease, assertAvailable };
if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
