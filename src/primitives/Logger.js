const util = require("util");

class Logger {
    constructor() {
        /** @type {(date: Date, level: "DEBUG"|"ACCESS"|"INFO"|"WARN"|"ERROR"|"FATAL", message: String) => void} */
        this._onLog = null;
    }

    get onlog() { return this._onLog; }
    /**
     * @param {(date: Date, level: "DEBUG"|"ACCESS"|"INFO"|"WARN"|"ERROR"|"FATAL", message: String) => void} value
     */
    set onlog(value) {
        if (!(value instanceof Function) || value.length !== 3) throw new Error("Bad value");
        this._onLog = value;
    }

    /**
     * @param {any[]} message
     */
    debug(...message) {
        this._onLog(new Date(), "DEBUG", util.format(message));
    }

    /**
     * @param {any[]} message
     */
    onAccess(...message) {
        this._onLog(new Date(), "ACCESS", util.format(message));
    }

    /**
     * @param {any[]} message
     */
    inform(...message) {
        this._onLog(new Date(), "INFO", util.format(message));
    }

    /**
     * @param {any[]} message
     */
    warn(...message) {
        this._onLog(new Date(), "WARN", util.format(message));
    }

    /**
     * @param {any[]} message
     */
    onError(...message) {
        this._onLog(new Date(), "ERROR", util.format(message));
    }

    /**
     * @param {any[]} message
     */
    onFatal(...message) {
        this._onLog(new Date(), "FATAL", util.format(message));
    }
}

module.exports = Logger;