'use strict';

const fs = require('node:fs');
const zlib = require('node:zlib');

// npm's generated archives use ordinary tar entries. Reject truncated archives.
exports.readArchive = function (archivePath) {
    const archive = zlib.gunzipSync(fs.readFileSync(archivePath));
    const entries = new Map();
    for (let offset = 0; offset + 512 <= archive.length;) {
        const header = archive.subarray(offset, offset + 512);
        const name = header.subarray(0, 100).toString().replace(/\0.*$/, '');
        if (!name) break;
        const prefix = header.subarray(345, 500).toString().replace(/\0.*$/, '');
        const size = Number.parseInt(header.subarray(124, 136).toString().replace(/\0.*$/, '').trim() || '0', 8);
        if (!Number.isSafeInteger(size) || size < 0 || offset + 512 + size > archive.length) {
            throw new Error('Invalid or truncated npm archive');
        }
        entries.set(prefix ? `${prefix}/${name}` : name, archive.subarray(offset + 512, offset + 512 + size));
        offset += 512 + Math.ceil(size / 512) * 512;
    }
    return entries;
};
