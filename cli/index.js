const fs = require("fs");
const ServerHandle = require("../src/ServerHandle");

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
require("./log-handler")(currentHandle);
currentHandle.start();

process.once("SIGINT", () => {
    currentHandle.stop();
    process.exitCode = 0;
});

// TODO: commands