const fs = require("fs");
const ServerHandle = require("../src/ServerHandle");

/**
 * @param {Date=} date
 */
function dateTime(date) {
    var date = date || new Date();
    var dy = date.getFullYear();
    var dm = ("00" + (date.getMonth() + 1)).slice(-2);
    var dd = ("00" + (date.getDate())).slice(-2);
    var th = ("00" + (date.getHours())).slice(-2);
    var tm = ("00" + (date.getMinutes())).slice(-2);
    var ts = ("00" + (date.getSeconds())).slice(-2);
    var tz = ("000" + (date.getMilliseconds())).slice(-3);
    return `${dy}-${dm}-${dd} ${th}:${tm}:${ts}.${tz}`;
}

/**
 * @param {Date} date
 */
function filename(date) {
    var dy = date.getFullYear();
    var dm = ("00" + (date.getMonth() + 1)).slice(-2);
    var dd = ("00" + (date.getDate())).slice(-2);
    var th = ("00" + (date.getHours())).slice(-2);
    var tm = ("00" + (date.getMinutes())).slice(-2);
    var ts = ("00" + (date.getSeconds())).slice(-2);
    return `${dy}-${dm}-${dd}T${th}-${tm}-${ts}.log`;
}

/**
 * @param {Date=} date
 */
function time(date) {
    var date = date || new Date();
    var th = date.getHours();
    var tm = date.getMinutes();
    var ts = date.getSeconds();
    th = ("00" + th).slice(-2);
    tm = ("00" + tm).slice(-2);
    ts = ("00" + ts).slice(-2);
    return `${th}:${tm}:${ts}`;
}

/**
 * @param {ServerHandle} handle
 */
module.exports = (handle) => {
    handle.logger.onlog = (date, level, message) => console.log(`${dateTime(date)} [${level}] ${message}`);
};