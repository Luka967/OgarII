class Matchmaker {
    /**
     * @param {ServerHandle} handle
     */
    constructor(handle) {
        this.handle = handle;
        /** @type {Connection[]} */
        this.queued = [];
    }

    /**
     * @param {Connection} connection
     */
    isInQueue(connection) {
        return this.queued.indexOf(connection) !== -1;
    }
    broadcastQueueLength() {
        if (!this.handle.settings.matchmakerNeedsQueuing) return;
        const message = `${this.queued.length}/${this.handle.settings.matchmakerBulkSize} are in queue`;
        for (let i = 0, l = this.queued.length; i < l; i++)
            this.handle.listener.globalChat.directMessage(null, this.queued[i], message);
    }
    /**
     * @param {Connection} connection
     */
    toggleQueued(connection) {
        this.isInQueue(connection) ? this.dequeue(connection) : this.enqueue(connection);
    }
    /**
     * @param {Connection} connection
     */
    enqueue(connection) {
        if (this.handle.settings.matchmakerNeedsQueuing)
            this.handle.listener.globalChat.directMessage(null, connection, "joined the queue");
        this.queued.push(connection);
        this.broadcastQueueLength();
    }
    /**
     * @param {Connection} connection
     */
    dequeue(connection) {
        if (this.handle.settings.matchmakerNeedsQueuing)
            this.handle.listener.globalChat.directMessage(null, connection, "left the queue");
        this.queued.splice(this.queued.indexOf(connection), 1);
        this.broadcastQueueLength();
    }

    update() {
        const bulkSize = this.handle.settings.matchmakerBulkSize;
        while (true) {
            if (this.queued.length < bulkSize) return;
            const world = this.getSuitableWorld();
            if (world === null) return;
            for (let i = 0; i < bulkSize; i++) {
                const next = this.queued.shift();
                if (this.handle.settings.matchmakerNeedsQueuing)
                    this.handle.listener.globalChat.directMessage(null, next, "match found!");
                world.addPlayer(next.player);
            }
        }
    }

    getSuitableWorld() {
        /** @type {World} */
        let bestWorld = null;
        for (let id in this.handle.worlds) {
            const world = this.handle.worlds[id];
            if (!this.handle.gamemode.canJoinWorld(world)) continue;
            if (world.stats.external >= this.handle.settings.worldMaxPlayers)
                continue;
            if (bestWorld === null || world.stats.external < bestWorld.stats.external)
                bestWorld = world;
        }
        if (bestWorld !== null) return bestWorld;
        else if (Object.keys(this.handle.worlds).length < this.handle.settings.worldMaxCount)
            return this.handle.createWorld();
        else return null;
    }
}

module.exports = Matchmaker;

const ServerHandle = require("../ServerHandle");
const Connection = require("../sockets/Connection");
const World = require("../worlds/World");
