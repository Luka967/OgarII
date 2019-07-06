const serverSource = {
    name: "Server",
    isServer: true,
    color: 0x3F3FC0
};

/** @param {Connection} connection */
function getSourceFromConnection(connection) {
    return {
        isServer: false,
        name: connection.player.chatName,
        color: connection.player.chatColor
    };
}

class ChatChannel {
    /**
     * @param {Listener} listener
     */
    constructor(listener) {
        this.listener = listener;
        /** @type {Connection[]} */
        this.connections = [];
    }

    get settings() { return this.listener.handle.settings; }

    /**
     * @param {Connection} connection
     */
    add(connection) {
        this.connections.push(connection);
    }
    /**
     * @param {Connection} connection
     */
    remove(connection) {
        this.connections.splice(this.connections.indexOf(connection), 1);
    }

    /**
     * @param {string} message
     */
    shouldFilter(message) {
        message = message.toLowerCase();
        for (let i = 0, l = this.settings.chatFilteredPhrases.length; i < l; i++)
            if (message.indexOf(this.settings.chatFilteredPhrases[i]) !== -1)
                return true;
        return false;
    }
    /**
     * @param {Connection=} source
     * @param {string} message
     */
    broadcast(source, message) {
        if (this.shouldFilter(message))
            return;
        const sourceInfo = source == null ? serverSource : getSourceFromConnection(source);
        for (let i = 0, l = this.connections.length; i < l; i++)
            this.connections[i].protocol.onChatMessage(sourceInfo, message);
    }
    /**
     * @param {Connection=} source
     * @param {Connection} recipient
     * @param {string} message
     */
    directMessage(source, recipient, message) {
        if (this.shouldFilter(message))
            return;
        const sourceInfo = source == null ? serverSource : getSourceFromConnection(source);
        recipient.protocol.onChatMessage(sourceInfo, message);
    }
}

module.exports = ChatChannel;

const Listener = require("./Listener");
const Connection = require("./Connection");
