const Bot = require("./Bot");

class Minion extends Bot {
    /**
     * @param {Connection} following
     */
    constructor(following) {
        super(following.player.world);
        
        this.following = following;
        following.minions.push(this);
    }

    close() {
        super.close();
        this.following.minions.splice(this.following.minions.indexOf(this), 1);
    }

    update() {
        if (this.player.world === null) return void this.close();
        if (this.following.isDisconnected) return void this.close();
        if (this.following.player === null) return void this.close();
        if (!this.following.player.exists) return void this.close();
        if (this.following.player.world !== this.player.world) return void this.close();
        const player = this.player;
        if (player.state === -1) {
            this.spawningName = this.listener.settings.minionName;
            this.onSpawnRequest();
            this.spawningName = null;
        }
        this.mouseX = this.following.minionsFrozen ? this.player.viewArea.x : this.following.mouseX;
        this.mouseY = this.following.minionsFrozen ? this.player.viewArea.y : this.following.mouseY;
    }
}

module.exports = Minion;

const Connection = require("../sockets/Connection");