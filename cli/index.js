const fs = require("fs");
const ServerHandle = require("../src/ServerHandle");
const { genCommand } = require("../src/commands/Commands");
const readline = require("readline");

if (!fs.existsSync("./settings.json")) {
    const defaultSettings = require("../src/Settings");
    const beautifulJson = require("json-beautify");
    fs.writeFileSync("./settings.json", beautifulJson(defaultSettings, null, 4), "utf-8");
    console.log("the default settings have been written to settings.json as one wasn't detected");
    console.log("re-run this script to start the server");
    process.exit(0);
}
const settings = JSON.parse(fs.readFileSync("./settings.json", "utf-8"));

const currentHandle = new ServerHandle(settings);
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
        desc: "stops the handle and closes the command stream",
        exec: (handle, args) => {
            handle.stop();
            commandStream.close();
            commandStreamClosing = true;
        }
    })
);

currentHandle.start();