const { Command, genCommand } = require("./Commands");

/**
 * @param {CommandList} list
 */
module.exports = (list) => {
    list.register(
        genCommand({
            name: "help",
            args: "",
            desc: "display all registered commands and their relevant information",
            exec: (handle, args) => {
                const list = handle.commands.list;
                const logger = handle.logger;
                for (let name in list) logger.print(list[name].toString());
            }
        }),
        genCommand({
            name: "setting",
            args: "<name> [value]",
            desc: "change/print the value of a setting",
            exec: (handle, args) => {
                if (args.length < 1) return void handle.logger.print("no setting name provided");
                if (!handle.settings.hasOwnProperty(args[0]))
                    return void handle.logger.print("unknown setting");
                if (args.length >= 2)
                    handle.settings[args[0]] = eval(args.slice(1).join(" "));
                handle.logger.print(handle.settings[args[0]]);
            }
        }),
        genCommand({
            name: "stop",
            args: "",
            desc: "close the server",
            exec: (handle, args) => {
                if (!handle.stop()) handle.logger.print("failed");
            }
        }),
        genCommand({
            name: "restart",
            args: "",
            desc: "restart the server",
            exec: (handle, args) => {
                if (!handle.stop()) return void handle.logger.print("failed");
                handle.start();
            }
        }),
        genCommand({
            name: "start",
            args: "",
            desc: "start the server",
            exec: (handle, args) => {
                if (!handle.start()) handle.logger.print("failed");
            }
        }),
    );
};

const { CommandList } = require("./Commands");
const ServerHandle = require("../ServerHandle");