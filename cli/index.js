const fs = require("fs");
const ServerHandle = require("../src/ServerHandle");

let settings = null;
if (!fs.existsSync("./settings.json")) {
    const defaultSettings = require("../src/Settings");
    const beautifulJson = require("json-beautify");
    fs.writeFileSync("./settings.json", beautifulJson(defaultSettings, null, 2), "utf-8");
    settings = defaultSettings;
} else settings = JSON.parse(fs.readFileSync("./settings.json", "utf-8"));

const currentHandle = new ServerHandle(settings);
require("./log-handler")(currentHandle);
currentHandle.start();

// TODO: commands