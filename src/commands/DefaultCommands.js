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
                for (let name in list) handle.logger.print(list[name].toString());
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
        genCommand({
            name: "eval",
            args: "",
            desc: "evaluate javascript code in the context of the handle and print the output",
            exec: (handle, args) => {
                handle.logger.print(
                    (function() {
                        try { return eval(args.join(" ")); }
                        catch (e) { return !e ? e : (e.toString() || e); }
                    }).bind(handle)()
                );
            }
        }),
        genCommand({
            name: "test",
            args: "",
            desc: "test command",
            exec: (handle, args) => handle.logger.print("success successful")
        }),
        genCommand({
            name: "stats",
            args: "",
            desc: "display critical information about the server",
            exec: (handle, args) => {
                const logger = handle.logger;
                if (!handle.running)
                    logger.print("not running");
                else {
                    const memory = process.memoryUsage();
                    memory.heapUsed /= 1048576;
                    memory.heapTotal /= 1048576;
                    memory.rss /= 1048576;
                    const { heapUsed, heapTotal, rss } = memory;
                    logger.print(`average tick time: ${handle.averageTickTime.toFixed(2)} ms / 40 ms`);
                    logger.print(`${heapUsed.toFixed(1)} MiB used heap / ${heapTotal.toFixed(1)} MiB total heap / ${rss.toFixed(1)} MiB allocated`);
                    logger.print(`${Object.keys(handle.worlds).length} worlds with ids ${Object.keys(handle.worlds).join(", ")}`);
                    const connections = handle.listener.connections.length;
                    const bots = handle.listener.allPlayingRouters.length - connections;
                    logger.print(`${Object.keys(handle.players).length} players, ${connections} connections, ${bots} bots`);
                }
            }
        }),
    );
};

const { CommandList } = require("./Commands");
const ServerHandle = require("../ServerHandle");