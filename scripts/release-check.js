'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { readArtifact } = require('./artifact');

function validateRelease(manifest, lock, packed, tag, prerelease) {
    assert.match(manifest.version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/, 'invalid release version');
    assert.equal(tag, `v${manifest.version}`, 'release tag must be v followed by the exact package version');
    assert.equal(lock.name, manifest.name);
    assert.equal(lock.version, manifest.version, 'lockfile version mismatch');
    assert.equal(lock.packages[''].name, manifest.name, 'root lockfile name mismatch');
    assert.equal(lock.packages[''].version, manifest.version, 'root lockfile version mismatch');
    if (manifest.name.startsWith('@')) assert.equal(manifest.publishConfig?.access, 'public', 'scoped release must explicitly be public');
    if (packed) {
        assert.equal(packed.name, manifest.name, 'packed package name mismatch');
        assert.equal(packed.version, manifest.version, 'packed package version mismatch');
        assert.deepEqual(packed.publishConfig, manifest.publishConfig, 'packed publishConfig mismatch');
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
    let filename;
    let archive;
    let packed;
    if (process.argv[2]) {
        const artifact = readArtifact(process.argv[2], manifest);
        ({ archive, filename, packed } = artifact);
        const { entries } = artifact;
        for (const runtime of Object.values(manifest['node-red'].nodes)) {
            for (const file of [runtime, runtime.replace(/\.js$/, '.html')]) assert.deepEqual(entries.get(`package/${file}`), fs.readFileSync(path.join(root, file)), `${file} differs from checkout`);
        }
        assert.deepEqual(entries.get('package/lib/supervised-mqtt.js'), fs.readFileSync(path.join(root, 'lib/supervised-mqtt.js')));
    }
    const prerelease = process.env.RELEASE_PRERELEASE;
    if (prerelease !== undefined) assert.ok(['true', 'false'].includes(prerelease));
    const tag = validateRelease(manifest, lock, packed, process.env.RELEASE_TAG, prerelease === undefined ? undefined : prerelease === 'true');
    if (process.env.CHECK_NPM_VERSION === '1') await assertAvailable(manifest.name, manifest.version);
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${manifest.version}\n${filename ? `filename=${filename}\n` : ''}dist_tag=${tag}\n`);
    console.log(`Release checks passed: ${manifest.name}@${manifest.version}, dist-tag ${tag}${archive ? ', checksum and packed runtime verified' : ''}`);
}

module.exports = { validateRelease, assertAvailable };
if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
