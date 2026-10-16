'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { readArchive } = require('./package-archive');

function validatePackMetadata(metadata, manifest) {
    assert.match(manifest.name, /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/, 'invalid package name');
    assert.match(manifest.version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/, 'invalid package version');
    assert.equal(metadata.name, manifest.name, 'pack metadata name mismatch');
    assert.equal(metadata.version, manifest.version, 'pack metadata version mismatch');
    assert.equal(typeof metadata.filename, 'string');
    assert.match(metadata.filename, /^[a-z0-9][a-zA-Z0-9._-]*\.tgz$/, 'unsafe artifact filename');
    // Validate npm's reported filename against its scoped-name flattening rule;
    // never use a raw @scope/name as a filesystem path or workflow output.
    const expected = `${manifest.name.replace(/^@/, '').replace('/', '-')}-${manifest.version}.tgz`;
    assert.equal(metadata.filename, expected, 'unexpected artifact filename');
    return metadata.filename;
}

function recordArtifact(metadata, manifest, directory) {
    const filename = validatePackMetadata(metadata, manifest);
    const archive = path.join(directory, filename);
    const checksum = createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
    fs.writeFileSync(`${archive}.sha256`, `${checksum}  ${filename}\n`);
    fs.writeFileSync(`${archive}.pack.json`, JSON.stringify({ name: metadata.name, version: metadata.version, filename }, null, 2) + '\n');
    return { archive, filename, checksum };
}

function readArtifact(target, manifest) {
    let archive = path.resolve(target);
    if (fs.statSync(archive).isDirectory()) {
        const files = fs.readdirSync(archive).filter((file) => file.endsWith('.tgz'));
        assert.equal(files.length, 1, 'expected exactly one release tarball');
        archive = path.join(archive, files[0]);
    }
    const metadata = JSON.parse(fs.readFileSync(`${archive}.pack.json`, 'utf8'));
    const filename = validatePackMetadata(metadata, manifest);
    assert.equal(path.basename(archive), filename, 'artifact basename mismatch');
    const checksum = createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
    assert.equal(fs.readFileSync(`${archive}.sha256`, 'utf8').trim(), `${checksum}  ${filename}`, 'tarball checksum mismatch');
    const entries = readArchive(archive);
    const packed = JSON.parse(entries.get('package/package.json'));
    assert.equal(packed.name, manifest.name, 'packed package name mismatch');
    assert.equal(packed.version, manifest.version, 'packed package version mismatch');
    return { archive, filename, checksum, packed, entries };
}

module.exports = { validatePackMetadata, recordArtifact, readArtifact };
