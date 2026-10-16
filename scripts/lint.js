'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

function checkDirectory(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) checkDirectory(file);
        else if (entry.name.endsWith('.js')) new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file });
    }
}

for (const directory of ['lib', 'scripts', 'test']) checkDirectory(path.join(root, directory));
for (const runtime of Object.values(require('../package.json')['node-red'].nodes)) {
    new vm.Script(fs.readFileSync(path.join(root, runtime), 'utf8'), { filename: runtime });
    const editor = runtime.replace(/\.js$/, '.html');
    const source = fs.readFileSync(path.join(root, editor), 'utf8');
    const scripts = Array.from(source.matchAll(/<script\s+type="text\/javascript"[^>]*>([\s\S]*?)<\/script>/g));
    if (scripts.length === 0) throw new Error(`No editor scripts found in ${editor}`);
    for (const [index, match] of scripts.entries()) new vm.Script(match[1], { filename: `${editor}:${index + 1}` });
}
for (const file of fs.readdirSync(path.join(root, 'examples')).filter((file) => file.endsWith('.json'))) {
    const flow = JSON.parse(fs.readFileSync(path.join(root, 'examples', file), 'utf8'));
    for (const node of flow) {
        if (node.type === 'function') new vm.Script(`(function(msg, node, context, flow, global) {\n${node.func}\n})`, { filename: `examples/${file}:${node.id}` });
    }
}
console.log('Runtime, editor, tooling, test, and example JavaScript syntax passed');
