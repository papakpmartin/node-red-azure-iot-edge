'use strict';

const { EventEmitter } = require('node:events');

// Small deterministic owner harness. Real Node-RED integration is covered separately.
exports.harness = function (register) {
    const constructors = new Map();
    const nodes = new Map();
    const RED = { nodes: {
        registerType: (type, constructor) => constructors.set(type, constructor),
        getNode: (id) => nodes.get(id),
        createNode(node, config) {
            const events = new EventEmitter();
            node.on = events.on.bind(events);
            node.emit = events.emit.bind(events);
            node.errors = [];
            node.messages = [];
            node.status = (status) => { node.lastStatus = status; };
            node.error = (error) => node.errors.push(error);
            node.warn = node.log = () => {};
            node.send = (message) => node.messages.push(message);
            nodes.set(config.id, node);
        }
    } };
    register(RED);
    return {
        create(type, config) { return new (constructors.get(type))(config); },
        close(node) { return new Promise((resolve) => node.emit('close', false, resolve)); }
    };
};

exports.flush = async function () {
    for (let i = 0; i < 12; i += 1) {
        await new Promise(setImmediate);
    }
};
