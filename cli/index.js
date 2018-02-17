const fs = require("fs");
const ServerHandle = require("../src/ServerHandle");
const { genCommand } = require("../src/commands/Commands");
const readline = require("readline");
const beautifulJson = require("json-beautify");

if (!fs.existsSync("./settings.json")) {
    const defaultSettings = require("../src/Settings");
    fs.writeFileSync("./settings.json", beautifulJson(defaultSettings, null, 4), "utf-8");
    console.log("the default settings have been written to settings.json as one wasn't detected");
    console.log("re-run this script to start the server");
    process.exit(0);
}
let settings = null;
try { settings = JSON.parse(fs.readFileSync("./settings.json", "utf-8")); }
catch (e) {
    console.log("caught error while parsing/reading settings.json:", e.stack);
    process.exit(1);
}

var currentHandle = new ServerHandle(settings);
const logger = currentHandle.logger;

require("./log-handler")(currentHandle);

var commandStreamClosing = false;
const commandStream = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    prompt: "",
    historySize: 50,
    removeHistoryDuplicates: true
});

function ask() {
    if (commandStreamClosing) return;
    commandStream.question("@ ", (input) => {
        if (!(input = input.trim())) return;
        logger.printFile(`@ ${input}`);
        if (!currentHandle.commands.execute(input))
            logger.warn(`unknown command ${input}`);
        process.nextTick(ask);
    });
}
logger.inform("command stream open");
setTimeout(ask, 1000);

process.once("SIGINT", () => {
    console.log("(caught SIGINT)");
    currentHandle.stop();
    process.exitCode = 0;
});

currentHandle.commands.register(
    genCommand({
        name: "exit",
        args: "",
        desc: "stop the handle and close the command stream",
        exec: (handle, args) => {
            handle.stop();
            commandStream.close();
            commandStreamClosing = true;
        }
    }),
    genCommand({
        name: "reload",
        args: "",
        desc: "reload the settings from local settings.json",
        exec: (handle, args) => {
            try {
                currentHandle.setSettings(JSON.parse(fs.readFileSync("./settings.json", "utf-8")));
            }
            catch (e) { logger.warn("caught error, possibly while parsing/reading settings.json:", e.stack); }
        }
    }),
    genCommand({
        name: "save",
        args: "",
        desc: "save the current settings to settings.json",
        exec: (handle, args) => {
            fs.writeFileSync("./settings.json", beautifulJson(handle.settings, null, 4), "utf-8");
            logger.print("done");
        }
    }),
);

currentHandle.start();