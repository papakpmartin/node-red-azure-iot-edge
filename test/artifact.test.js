'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');
const { validatePackMetadata, recordArtifact, readArtifact } = require('../scripts/artifact');

for (const name of ['example-package', '@papakpmartin/example-package']) {
    test(`verify npm's real artifact filename and identity for ${name}`, (t) => {
        const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'iot-artifact-test-'));
        t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
        const manifest = { name, version: '1.0.0-rc.3', publishConfig: { access: 'public' } };
        fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify(manifest));
        const npm = process.env.npm_execpath;
        const args = ['pack', '--json', '--ignore-scripts'];
        const metadata = JSON.parse(execFileSync(npm ? process.execPath : 'npm', npm ? [npm, ...args] : args, { cwd: directory, encoding: 'utf8' }))[0];
        const { archive, filename } = recordArtifact(metadata, manifest, directory);
        assert.equal(readArtifact(directory, manifest).filename, filename);
        assert.equal(readArtifact(archive, manifest).packed.name, name);
        assert.throws(() => readArtifact(archive, { ...manifest, name: '@wrong/example-package' }), /name mismatch/);
        assert.throws(() => readArtifact(archive, { ...manifest, version: '1.0.0' }), /version mismatch/);
        assert.throws(() => validatePackMetadata({ ...metadata, filename: '../unsafe.tgz' }, manifest), /unsafe/);
        assert.throws(() => validatePackMetadata({ ...metadata, filename: 'wrong.tgz' }, manifest), /unexpected/);
        fs.copyFileSync(archive, path.join(directory, 'extra.tgz'));
        assert.throws(() => readArtifact(directory, manifest), /exactly one/);
        fs.writeFileSync(`${archive}.sha256`, 'corrupt');
        assert.throws(() => readArtifact(archive, manifest), /checksum mismatch/);
        // Even a matching sidecar cannot make a different packed identity valid.
        recordArtifact(metadata, manifest, directory);
        const other = { ...manifest, name: 'wrong-package' };
        const otherFilename = `wrong-package-${manifest.version}.tgz`;
        fs.copyFileSync(archive, path.join(directory, otherFilename));
        recordArtifact({ name: other.name, version: other.version, filename: otherFilename }, other, directory);
        assert.throws(() => readArtifact(path.join(directory, otherFilename), other), /packed package name mismatch/);
    });
}
