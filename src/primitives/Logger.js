const util = require("util");

class Logger {
    constructor() {
        /** @type {LogEvent} */
        this._onLog = null;
    }

    get onlog() { return this._onLog; }
    /**
     * @param {LogEvent} value
     */
    set onlog(value) {
        if (!(value instanceof Function) || value.length !== 3) throw new Error("bad value");
        this._onLog = value;
    }

    /**
     * @param {LogMessageData} message
     * @private
     */
    _formatMessage(...message) { return util.format.apply(null, ...message); }

    /**
     * @param {LogMessageData} message
     */
    print(...message) {
        this._onLog && this._onLog(new Date(), "PRINT", this._formatMessage(message));
    }
    /**
     * @param {LogMessageData} message
     */
    printFile(...message) {
        this._onLog && this._onLog(new Date(), "FILE", this._formatMessage(message));
    }

    /**
     * @param {LogMessageData} message
     */
    debug(...message) {
        this._onLog && this._onLog(new Date(), "DEBUG", this._formatMessage(message));
    }

    /**
     * @param {LogMessageData} message
     */
    onAccess(...message) {
        this._onLog && this._onLog(new Date(), "ACCESS", this._formatMessage(message));
    }

    /**
     * @param {LogMessageData} message
     */
    inform(...message) {
        this._onLog && this._onLog(new Date(), "INFO", this._formatMessage(message));
    }

    /**
     * @param {LogMessageData} message
     */
    warn(...message) {
        this._onLog && this._onLog(new Date(), "WARN", this._formatMessage(message));
    }

    /**
     * @param {LogMessageData} message
     */
    onError(...message) {
        this._onLog && this._onLog(new Date(), "ERROR", this._formatMessage(message));
    }

    /**
     * @param {LogMessageData} message
     */
    onFatal(...message) {
        this._onLog && this._onLog(new Date(), "FATAL", this._formatMessage(message));
    }
}

module.exports = Logger;
