const util = require("util");

class Logger {
    constructor() {
        /** @type {(date: Date, level: "DEBUG"|"ACCESS"|"INFO"|"WARN"|"ERROR"|"FATAL", message: String) => void} */
        this._onLog = null;
    }

    get onlog() { return this._onLog; }
    /**
     * @param {(date: Date=, level: null|"DEBUG"|"ACCESS"|"INFO"|"WARN"|"ERROR"|"FATAL", message: String) => void} value
     */
    set onlog(value) {
        if (!(value instanceof Function) || value.length !== 3) throw new Error("Bad value");
        this._onLog = value;
    }

    /**
     * @param {any[]} message
     * @private
     */
    _formatMessage(...message) { return util.format.apply(null, ...message); }

    /**
     * @param {any[]} message
     */
    print(...message) {
        this._onLog && this._onLog(new Date(), "PRINT", this._formatMessage(message));
    }
    /**
     * @param {any[]} message
     */
    printFile(...message) {
        this._onLog && this._onLog(new Date(), "FILE", this._formatMessage(message));
    }

    /**
     * @param {any[]} message
     */
    debug(...message) {
        this._onLog && this._onLog(new Date(), "DEBUG", this._formatMessage(message));
    }

    /**
     * @param {any[]} message
     */
    onAccess(...message) {
        this._onLog && this._onLog(new Date(), "ACCESS", this._formatMessage(message));
    }

    /**
     * @param {any[]} message
     */
    inform(...message) {
        this._onLog && this._onLog(new Date(), "INFO", this._formatMessage(message));
    }

    /**
     * @param {any[]} message
     */
    warn(...message) {
        this._onLog && this._onLog(new Date(), "WARN", this._formatMessage(message));
    }

    /**
     * @param {any[]} message
     */
    onError(...message) {
        this._onLog && this._onLog(new Date(), "ERROR", this._formatMessage(message));
    }

    /**
     * @param {any[]} message
     */
    onFatal(...message) {
        this._onLog && this._onLog(new Date(), "FATAL", this._formatMessage(message));
    }
}

module.exports = Logger;