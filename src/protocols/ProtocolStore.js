
class ProtocolStore {
    constructor() {
        /** @type {typeof Protocol[]} */
        this.store = [];
    }

    /**
     * @param {typeof Protocol[]} protocols
     */
    register(...protocols) {
        this.store.splice(this.store.length, 0, ...protocols);
    }

    /**
     * @param {Connection} connection
     * @param {Reader} reader
     */
    decide(connection, reader) {
        for (let i = 0; i < this.store.length; i++) {
            const generated = new this.store[i](connection);
            if (!generated.distinguishes(reader)) {
                reader.offset = 0;
                continue;
            }
            return connection.socketDisconnected ? null : generated;
        }
        return null;
    }
}

module.exports = ProtocolStore;

const Protocol = require("./Protocol");
const Connection = require("../sockets/Connection");
const Reader = require("../primitives/Reader");
