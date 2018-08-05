
class ProtocolHandle {
    constructor() {
        /** @type {typeof Protocol[]} */
        this.protocols = [];
    }

    /**
     * @param {typeof Protocol} protocol
     */
    register(protocol) {
        this.protocols.push(protocol);
    }

    /**
     * @param {typeof Protocol} protocol
     */
    unregister(protocol) {
        const index = this.protocols.indexOf(protocol);
        if (index === -1) return false;
        this.protocols.splice(index, 1);
        return true;
    }

    /**
     * @param {Connection} connection
     * @param {Reader} reader
     */
    decide(connection, reader) {
        for (let i = 0; i < this.protocols.length; i++) {
            const generated = new this.protocols[i](connection);
            if (!generated.distinguishes(reader)) {
                reader.offset = 0;
                continue;
            }
            return connection.socketDisconnected ? null : generated;
        }
        return null;
    }
}

module.exports = ProtocolHandle;

const Protocol = require("./Protocol");
const Connection = require("../sockets/Connection");
const Reader = require("../primitives/Reader");