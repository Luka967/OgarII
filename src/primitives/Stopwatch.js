function Stopwatch() { }

global.Stopwatch = Stopwatch;

Stopwatch.prototype.begin = function() {
    if (this._start) return;
    this._start = this._lap = process.hrtime();
};

Stopwatch.prototype.lap = function() {
    var diff = process.hrtime(this._lap);
    this._lap = process.hrtime();
    return diff[0] * 1e3 + diff[1] / 1e6;
};

Stopwatch.prototype.elapsed = function() {
    var diff = process.hrtime(this._start);
    return diff[0] * 1e3 + diff[1] / 1e6;
};

Stopwatch.prototype.stop = function() {
    this._start = this._lap = undefined;
};

Stopwatch.prototype.reset = function() {
    this._start = this._lap = process.hrtime();
};
