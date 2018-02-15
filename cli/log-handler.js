const { EOL } = require("os");
const fs = require("fs");

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

const logging = {
    showingConsole: {
        DEBUG: true,
        ACCESS: true,
        INFO: true,
        WARN: true,
        ERROR: true,
        FATAL: true
    },
    showingFile: {
        DEBUG: true,
        ACCESS: true,
        INFO: true,
        WARN: true,
        ERROR: true,
        FATAL: true
    },
    fileLogDirectory: "./logs/",
    fileLogSaveOld: false
};

const logFolderLoc = logging.fileLogDirectory;
const logLoc = `${logging.fileLogDirectory}latest.log`;
const oldLogsFolderLoc = logging.fileLogDirectory + "old/";

if (!fs.existsSync(logFolderLoc)) fs.mkdirSync(logFolderLoc);
if (fs.existsSync(logLoc)) {
    if (logging.fileLogSaveOld) {
        if (!fs.existsSync(oldLogsFolderLoc)) fs.mkdirSync(oldLogsFolderLoc);
        const oldLogLoc = `${logging.fileLogDirectory}old/${filename(fs.statSync(logLoc).ctime)}`;
        fs.renameSync(logLoc, oldLogLoc);
    } else fs.unlinkSync(logLoc);
}

var fstream = fs.createWriteStream(logLoc);
var fqueue = [];
var fconsuming = null;
var fprocessing = false;
var synchronous = false;
var flushed = false;

function write(date, level, message) {
    const writing = `${dateTime(date)} [${level}] ${message}${EOL}`;
    if (logging.showingConsole[level])
        process.stdout.write(writing);
    if (logging.showingFile[level]) {
        fqueue.push(writing);
        if (!fprocessing && !synchronous) fprocess();
    }
}
function fprocess() {
    fconsuming = null;
    if (fqueue.length === 0)
        return void (fprocessing = false);
    fconsuming = fqueue.join("");
    fstream.write(fconsuming, fprocess);
    fqueue.splice(0);
    return void (fprocessing = false);
}
function fprocessSync() {
    fstream.destroy();
    fstream = null;
    var tail = `${fconsuming || ""}${fqueue.join("")}`;
    fs.appendFileSync(logLoc, tail, "utf-8");
    fqueue.splice(0);
}
process.once("uncaughtException", function(exception) {
    synchronous = true;
    write(new Date(), "FATAL", exception.stack);
    write(new Date(), "ERROR", "uncaught exception - process is terminating");
    fprocessSync();
    process.removeAllListeners("exit");
    process.exit(1);
});
process.once("exit", function(code) {
    synchronous = true;
    write(new Date(), "INFO", `ended with code ${code}`);
    fprocessSync();
});

/**
 * @param {ServerHandle} handle
 */
module.exports = (handle) => handle.logger.onlog = write;

const ServerHandle = require("../src/ServerHandle");