class Stopwatch {
    constructor() { }
    begin() {
        if (this._start) return;
        this._start = this._lap = process.hrtime();
    }
    lap() {
        const diff = process.hrtime(this._lap);
        this._lap = process.hrtime();
        return diff[0] * 1e3 + diff[1] / 1e6;
    }
    elapsed() {
        const diff = process.hrtime(this._start);
        return diff[0] * 1e3 + diff[1] / 1e6;
    }
    stop() {
        this._start = this._lap = undefined;
    }
    reset() {
        this._start = this._lap = process.hrtime();
    }
}

module.exports = Stopwatch;
