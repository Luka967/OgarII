class Ticker {
    /**
     * @param {number=} step
     */
    constructor(step) {
        this.step = step || 16.67;
        this.running = false;
        /** @type {Function[]} */
        this.callbacks = [];
    }
    /**
     * @param {Function} callback
     */
    add(callback) {
        if (!(callback instanceof Function))
            throw new TypeError("given object isn't a function");
        this.callbacks.push(callback);
        return this;
    }
    /**
     * @param {Function} callback
     */
    remove(callback) {
        if (!(callback instanceof Function))
            throw new TypeError("given object isn't a function");
        const i = this.callbacks.indexOf(callback);
        if (i === -1) throw new Error("given function wasn't added");
        this.callback.splice(i, 1);
        return this;
    }
    start() {
        if (this.running) throw new Error("The ticker has already started");
        this._bind = this._tick.bind(this);
        this.running = true;
        this._suppTime = Date.now();
        this._timeoutId = setTimeout(this._bind, this.step);
        this.running = true;
        return this;
    }
    _tick() {
        if (!this.running) return;
        for (let i = 0, l = this.callbacks.length; i < l; i++)
            this.callbacks[i]();
        this._suppTime += this.step;
        const diff = (this._suppTime + this.step) - Date.now();
        if (diff < 0) this._suppTime -= diff;
        this._timeoutId = setTimeout(this._bind, diff);
    }
    stop() {
        if (!this.running) throw new Error("The ticker hasn't started");
        clearTimeout(this._timeoutId);
        delete this._timeoutId;
        delete this._suppTime;
        delete this._bind;
        this.running = false;
        return this;
    }
}

module.exports = Ticker;
