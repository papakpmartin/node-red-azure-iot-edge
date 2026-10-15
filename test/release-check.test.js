'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { validateRelease, assertAvailable } = require('../scripts/release-check');

function fixture(version = '1.0.0-rc.1') {
    return {
        manifest: { name: 'example', version },
        lock: { name: 'example', version, packages: { '': { version } } },
        packed: { name: 'example', version }
    };
}

test('release checks select next for prereleases and latest only for stable versions', () => {
    for (const [version, prerelease, tag] of [['1.0.0-rc.1', true, 'next'], ['1.0.0', false, 'latest']]) {
        const { manifest, lock, packed } = fixture(version);
        assert.equal(validateRelease(manifest, lock, packed, `v${version}`, prerelease), tag);
    }
});

test('release checks reject mismatched tags, manifests, lockfiles and release flags', () => {
    const { manifest, lock, packed } = fixture();
    assert.throws(() => validateRelease(manifest, lock, packed, 'v1.0.0', true), /release tag/);
    assert.throws(() => validateRelease(manifest, { ...lock, version: '0.6.1' }, packed, 'v1.0.0-rc.1', true), /lockfile/);
    assert.throws(() => validateRelease(manifest, lock, { ...packed, version: '1.0.0' }, 'v1.0.0-rc.1', true), /packed package version/);
    assert.throws(() => validateRelease(manifest, lock, { ...packed, name: 'wrong' }, 'v1.0.0-rc.1', true), /packed package name/);
    assert.throws(() => validateRelease(manifest, lock, packed, 'v1.0.0-rc.1', false), /prerelease flag/);
});

test('only a confirmed npm 404 means a release version is available', async () => {
    await assertAvailable('example', '1.0.0', async () => ({ status: 404 }));
    await assert.rejects(assertAvailable('example', '1.0.0', async () => ({ status: 200 })), /already exists/);
    await assert.rejects(assertAvailable('example', '1.0.0', async () => ({ status: 503 })), /HTTP 503/);
    await assert.rejects(assertAvailable('example', '1.0.0', async () => { throw new Error('offline'); }), /offline/);
});
