'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const root = path.resolve(__dirname, '..');
const files = fs.readdirSync(path.join(root, 'examples')).filter((file) => file.endsWith('.json')).sort();
const configs = new Set(['moduleclient', 'device-client']);
const custom = new Set(['moduleinput', 'moduleoutput', 'moduletwin', 'modulemethod', 'device-twin']);

for (const file of files) {
    test(`${file} is self-contained, manual, annotated and correctly scoped`, () => {
        const flow = JSON.parse(fs.readFileSync(path.join(root, 'examples', file), 'utf8'));
        const nodes = new Map(flow.map((node) => [node.id, node]));
        assert.equal(nodes.size, flow.length, 'duplicate node IDs');
        const tabs = flow.filter((node) => node.type === 'tab');
        assert.equal(tabs.length, 1);
        assert.ok(tabs[0].info);
        assert.ok(flow.some((node) => node.type === 'comment' && node.name.startsWith('Start here:') && node.info));
        assert.equal(flow.filter((node) => configs.has(node.type)).length, 1);
        for (const node of flow) {
            if (node.type !== 'tab' && !configs.has(node.type)) {
                assert.equal(node.z, tabs[0].id, `${node.id}: missing tab`);
                assert.equal(typeof node.x, 'number');
                assert.equal(typeof node.y, 'number');
            }
            if (custom.has(node.type)) {
                assert.equal(nodes.get(node.client)?.type, node.type === 'device-twin' ? 'device-client' : 'moduleclient');
            }
            for (const target of (node.wires || []).flat()) assert.ok(nodes.has(target), `${node.id}: dangling wire ${target}`);
            if (node.type === 'inject') {
                assert.equal(node.once, false, 'examples must not send at startup');
                assert.equal(node.repeat, '', 'examples must not send periodically');
                assert.equal(node.crontab, '');
                if (node.payloadType === 'json') JSON.parse(node.payload);
            }
            if (['catch', 'status', 'complete'].includes(node.type)) {
                assert.ok(Array.isArray(node.scope) && node.scope.length > 0, 'diagnostics must be scoped');
                for (const target of node.scope) assert.ok(nodes.has(target), `unknown scope ${target}`);
                assert.ok(node.wires[0].some((id) => nodes.get(id)?.type === 'debug'));
            }
        }
        if (file !== 'example.json') {
            for (const type of ['catch', 'status', 'complete']) assert.ok(flow.some((node) => node.type === type));
        }
    });
}

test('forwarding examples preserve scalar JSON values and do not mutate input objects', () => {
    for (const file of ['04-module-input-output.json', 'example.json']) {
        const flow = JSON.parse(fs.readFileSync(path.join(root, 'examples', file), 'utf8'));
        const transform = new Function('msg', flow.find((node) => node.name === 'Prepare output payload').func);
        for (const payload of [false, 0, null, '', 'hello', '{"literal":true}', [1, false, null]]) {
            const msg = { payload, requestId: 'retained', topic: 'input' };
            assert.equal(transform(msg), msg);
            const encoded = typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload;
            assert.deepEqual(encoded, payload);
            assert.equal(msg.requestId, 'retained');
        }
        const original = { temperature: 21.5 };
        const msg = { payload: original };
        transform(msg);
        assert.deepEqual(original, { temperature: 21.5 });
        assert.equal(msg.payload.temperature, 21.5);
        assert.ok(Number.isFinite(Date.parse(msg.payload.forwardedAt)));
    }
});

test('method examples echo native JSON and retain the original request identifier', () => {
    for (const file of ['03-module-method.json', 'example.json']) {
        const flow = JSON.parse(fs.readFileSync(path.join(root, 'examples', file), 'utf8'));
        const method = flow.find((node) => node.type === 'modulemethod');
        assert.equal(method.method, 'echo');
        const response = flow.find((node) => node.type === 'function' && node.wires[0].includes(method.id));
        const respond = new Function('msg', response.func);
        for (const payload of [{ value: 42 }, false, 0, '', null]) {
            const msg = { payload, requestId: 'opaque-id' };
            assert.equal(respond(msg), msg);
            assert.equal(msg.requestId, 'opaque-id');
            assert.equal(msg.status, 200);
            assert.deepEqual(msg.payload, { echo: payload });
        }
    }
});

test('README local links exist and routing examples match the exported node names', () => {
    const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
    for (const [, target] of readme.matchAll(/\]\(([^)]+)\)/g)) {
        if (!target.startsWith('https://') && !target.startsWith('#')) assert.ok(fs.existsSync(path.join(root, target)), `broken README link: ${target}`);
    }
    assert.ok(readme.includes('/modules/nodeRed/outputs/output1'));
    assert.ok(readme.includes('/modules/nodeRed/inputs/input1'));
    assert.ok(readme.includes('/modules/nodeRed/outputs/output2'));
    const direct = require('../examples/01-module-output.json');
    const forward = require('../examples/04-module-input-output.json');
    assert.equal(direct.find((node) => node.type === 'moduleoutput').output, 'output1');
    assert.equal(forward.find((node) => node.type === 'moduleinput').input, 'input1');
    assert.equal(forward.find((node) => node.type === 'moduleoutput').output, 'output2');
});
