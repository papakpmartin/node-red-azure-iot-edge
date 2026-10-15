'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');

const root = path.resolve(__dirname, '..');
const destination = path.join(root, 'dist');
fs.mkdirSync(destination, { recursive: true });
const npm = process.env.npm_execpath;
const args = ['pack', '--json', '--ignore-scripts', '--pack-destination', destination];
const result = JSON.parse(execFileSync(npm ? process.execPath : 'npm', npm ? [npm, ...args] : args, { cwd: root, encoding: 'utf8' }));
const archive = path.join(destination, result[0].filename);
const checksum = createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
fs.writeFileSync(`${archive}.sha256`, `${checksum}  ${path.basename(archive)}\n`);
console.log(`${archive}\nSHA-256: ${checksum}`);
