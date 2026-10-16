'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { recordArtifact } = require('./artifact');

const root = path.resolve(__dirname, '..');
const destination = path.join(root, 'dist');
fs.mkdirSync(destination, { recursive: true });
const npm = process.env.npm_execpath;
const args = ['pack', '--json', '--ignore-scripts', '--pack-destination', destination];
const result = JSON.parse(execFileSync(npm ? process.execPath : 'npm', npm ? [npm, ...args] : args, { cwd: root, encoding: 'utf8' }));
if (result.length !== 1) throw new Error('Expected exactly one packed artifact');
const { archive, filename, checksum } = recordArtifact(result[0], require('../package.json'), destination);
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `filename=${filename}\n`);
console.log(`${archive}\nSHA-256: ${checksum}`);
