const Messages = {
    DisplayChatMessage: require("../messages/DisplayChatMessage")
};

const serverSource = {
    name: "Server",
    isServer: true,
    color: {
        r: 63,
        g: 63,
        b: 192
    }
};

/** @param {Connection} connection */
function getSourceFromConnection(connection) {
    if (connection.player == null) return null;
    const player = connection.player;
    const hasCells = player.state === 0;
    return {
        isServer: false,
        name: !hasCells ? "Spectator" : (player.ownedCells[0].name || "An unnamed cell"),
        color: hasCells ? player.ownedCells[0].color : { r: 127, g: 127, b: 127 }
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
     * @param {Connection=} source
     * @param {string} message
     */
    broadcast(source, message) {
        const sourceInfo = source === null ? serverSource : getSourceFromConnection(source);
        for (let i = 0, l = this.connections.length; i < l; i++)
            this.connections[i].send(Messages.DisplayChatMessage(sourceInfo, message, this.connections[i].protocol));
    }

    /**
     * @param {Connection=} source
     * @param {Connection} recipient
     * @param {string} message
     */
    directMessage(source, recipient, message) {
        const sourceInfo = source === null ? serverSource : getSourceFromConnection(source);
        recipient.send(Messages.DisplayChatMessage(sourceInfo, message, recipient.protocol));
    }
}

module.exports = ChatChannel;

const Listener = require("./Listener");
const Connection = require("./Connection");