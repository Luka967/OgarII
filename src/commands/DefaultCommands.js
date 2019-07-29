const { Command, genCommand } = require("./CommandList");
const { EOL } = require("os");
const { inspect } = require("util");

const Minion = require("../bots/Minion");
const PlayerBot = require("../bots/PlayerBot");

const IPvalidate = /((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))/;

/**
 * @param {string} str
 * @param {string} pad
 * @param {number} len
 */
function padRight(str, pad, len) {
    return str + new Array(Math.max(len - str.length, 0)).fill(pad).join("");
}
/**
 * @param {string} str
 * @param {string} pad
 * @param {number} len
 */
function padLeft(str, pad, len) {
    return new Array(Math.max(len - str.length, 0)).fill(pad).join("") + str;
}

/**
 * @param {GenCommandTable} contents
 * @param {string} eol
 */
function table(contents, eol) {
    const columnSizes = [];
    let all = "", i, j, rowText, row, col, size;
    for (i = 0; i < contents.columns.length; i++) {
        col = contents.columns[i];
        size = col.text.length;
        for (j = 0; j < contents.rows.length; j++)
            size = Math.max(size, contents.rows[j][i] ? contents.rows[j][i].length : 0);
        columnSizes.push(size);
    }
    for (i = 0, rowText = ""; i < contents.columns.length; i++) {
        col = contents.columns[i];
        rowText += (i == 0 ? "" : col.separated ? " | " : " ") + padRight(col.text, col.headPad, columnSizes[i]);
    }
    all += rowText + eol;
    for (i = 0, rowText = ""; i < contents.rows.length; i++, rowText = "") {
        for (j = 0; j < contents.rows[i].length; j++) {
            row = contents.rows[i][j] || "";
            col = contents.columns[j];
            rowText += (j == 0 ? "" : col.separated ? " | " : " ") + padRight(row, row ? col.rowPad : col.emptyPad, columnSizes[j]);
        }
        for (; j < contents.columns.length; j++) {
            col = contents.columns[j];
            rowText += (j == 0 ? "" : col.separated ? " | " : " ") + padRight("", col.emptyPad, columnSizes[j]);
        }
        all += rowText + eol;
    }
    return all;
}
/**
 * @param {SettingIdType} id
 */
function splitSettingId(id) {
    let items = [], reg, i = 0;
    while ((reg = /([a-z]+)|([A-Z][a-z]+)|([A-Z])/.exec(id)) != null && ++i < 10) {
        const capture = reg[1] || reg[2] || reg[3];
        items.push(capture.toLowerCase()), id = id.replace(capture, "");
    }
    return items;
}
/**
 * @param {string[]} a
 * @param {string[]} b
 */
function getSplitSettingHits(a, b) {
    let hits = 0;
    for (let i = 0, l = b.length; i < l; i++)
        if (a.indexOf(b[i]) !== -1) hits++;
    return hits;
}

/** @param {number} value */
function prettyMemory(value) {
    const units = ["B", "kiB", "MiB", "GiB", "TiB"]; let i = 0;
    for (; i < units.length && value / 1024 > 1; i++)
        value /= 1024;
    return `${value.toFixed(1)} ${units[i]}`;
}
/** @param {NodeJS.MemoryUsage} value */
function prettyMemoryData(value) {
    return {
        heapUsed: prettyMemory(value.heapUsed),
        heapTotal: prettyMemory(value.heapTotal),
        rss: prettyMemory(value.rss),
        external: prettyMemory(value.external)
    }
}
/** @param {number} seconds */
function prettyTime(seconds) {
    seconds = ~~seconds;

    let minutes = ~~(seconds / 60);
    if (minutes < 1) return `${seconds} seconds`;
    if (seconds === 60) return `1 minute`;

    let hours = ~~(minutes / 60);
    if (hours < 1) return `${minutes} minute${minutes === 1 ? "" : "s"} ${seconds % 60} second${seconds === 1 ? "" : "s"}`;
    if (minutes === 60) return `1 hour`;

    let days = ~~(hours / 24);
    if (days < 1) return `${hours} hour${hours === 1 ? "" : "s"} ${minutes % 60} minute${minutes === 1 ? "" : "s"}`;
    if (hours === 24) return `1 day`;
    return `${days} day${days === 1 ? "" : "s"} ${hours % 24} hour${hours === 1 ? "" : "s"}`;
}
/** @param {number} seconds */
function shortPrettyTime(milliseconds) {
    let seconds = ~~(milliseconds / 1000);
    if (seconds < 1) return `${milliseconds}ms`;
    if (milliseconds === 1000) return `1s`;

    let minutes = ~~(seconds / 60);
    if (minutes < 1) return `${seconds}s`;
    if (seconds === 60) return `1m`;

    let hours = ~~(minutes / 60);
    if (hours < 1) return `${minutes}m`;
    if (minutes === 60) return `1h`;

    let days = ~~(hours / 24);
    if (days < 1) return `${hours}h`;
    if (hours === 24) return `1d`;
    return `${days}d`;
}

/**
 * @param {string[]} args
 * @param {ServerHandle} handle
 * @param {number} index
 * @param {boolean} needAlive
 */
function getPlayerByID(args, handle, index, needAlive) {
    if (args.length <= index)
        return handle.logger.print("missing player id"), false;
    const id = parseInt(args[index]);
    if (isNaN(id))
        return handle.logger.print("invalid number for player id"), false;
    if (!handle.players.hasOwnProperty(id))
        return handle.logger.print("no player has this id"), false;
    if (handle.players[id].state !== 0 && needAlive)
        return handle.logger.print("player is not alive"), false;
    return handle.players[id];
}
/**
 * @param {string[]} args
 * @param {ServerHandle} handle
 * @param {number} index
 * @param {boolean} needRunning
 */
function getWorldByID(args, handle, index, needRunning) {
    if (args.length <= index)
        return handle.logger.print("missing world id"), false;
    const id = parseInt(args[index]);
    if (isNaN(id))
        return handle.logger.print("invalid number for world id"), false;
    if (!handle.worlds.hasOwnProperty(id))
        return handle.logger.print("no world has this id"), false;
    if (handle.worlds[id].frozen && needRunning)
        return handle.logger.print("world is frozen"), false;
    return handle.worlds[id];
}

/**
 * @param {string[]} args
 * @param {ServerHandle} handle
 * @param {number} index
 * @param {string} argName
 */
function getFloat(args, handle, index, argName) {
    if (args.length <= index)
        return handle.logger.print(`missing ${argName}`), false;
    const value = parseFloat(args[index]);
    if (isNaN(value))
        return handle.logger.print(`invalid number for ${argName}`), false;
    return value;
}
/**
 * @param {string[]} args
 * @param {ServerHandle} handle
 * @param {number} index
 * @param {string} argName
 */
function getInt(args, handle, index, argName) {
    if (args.length <= index)
        return handle.logger.print(`missing ${argName}`), false;
    const value = parseInt(args[index]);
    if (isNaN(value))
        return handle.logger.print(`invalid number for ${argName}`), false;
    return value;
}
/**
 * @param {string[]} args
 * @param {ServerHandle} handle
 * @param {number} index
 * @param {string} argName
 */
function getString(args, handle, index, argName) {
    if (args.length <= index)
        return handle.logger.print(`missing ${argName}`), false;
    const value = args[index].trim();
    if (value.length === 0)
        return handle.logger.print(`invalid string for ${argName}`), false;
    return value;
}

/**
 * @param {CommandList} commands
 * @param {CommandList} chatCommands
 */
module.exports = (commands, chatCommands) => {
    commands.register(
        genCommand({
            name: "help",
            args: "",
            desc: "display all registered commands and their relevant information",
            /**
             * @param {ServerHandle} context
             */
            exec: (handle, context, args) => {
                const list = handle.commands.list;
                const keys = Object.keys(list).sort();
                handle.logger.print(table({
                    columns: [
                        { text: "NAME",        headPad: " ", emptyPad: " ", rowPad: " ", separated: false },
                        { text: "ARGUMENTS",   headPad: " ", emptyPad: " ", rowPad: " ", separated: false },
                        { text: "DESCRIPTION", headPad: " ", emptyPad: " ", rowPad: " ", separated: true  }
                    ],
                    rows: keys.map(v => {
                        return [
                            list[v].name,
                            list[v].args,
                            list[v].description
                        ]
                    })
                }, EOL));
            }
        }),
        genCommand({
            name: "routers",
            args: "[router type]",
            desc: "display information about routers and their players",
            /**
             * @param {ServerHandle} context
             */
            exec: (handle, context, args) => {
                const matchingType = args.length >= 1 ? args[0] : null;
                const routers = handle.listener.routers
                    .filter(v => matchingType === null || v.type == matchingType);
                handle.logger.print(table({
                    columns: [
                        { text: "INDEX",    headPad: " ", emptyPad: "/", rowPad: " ", separated: false },
                        { text: "TYPE",     headPad: " ", emptyPad: "/", rowPad: " ", separated: false },
                        { text: "SOURCE",   headPad: " ", emptyPad: "/", rowPad: " ", separated: true  },
                        { text: "ACTIVE",   headPad: " ", emptyPad: "/", rowPad: " ", separated: false },
                        { text: "DORMANT",  headPad: " ", emptyPad: "/", rowPad: " ", separated: false },
                        { text: "PROTOCOL", headPad: " ", emptyPad: "/", rowPad: " ", separated: false },
                        { text: "PID",      headPad: " ", emptyPad: "/", rowPad: " ", separated: false }
                    ],
                    rows: routers.map((v, i) => [
                        i.toString(),
                        v.type,
                        v.type === "connection" ? v.remoteAddress : null,
                        v.type === "connection" ? shortPrettyTime(Date.now() - v.connectTime) : null,
                        v.type === "connection" ? shortPrettyTime(Date.now() - v.lastActivityTime) : null,
                        v.protocol ? v.protocol.subtype : null,
                        v.hasPlayer ? v.player.id.toString() : null,
                    ])
                }, EOL));
            }
        }),
        genCommand({
            name: "players",
            args: "[world id or \"any\"] [router type]",
            desc: "display information about players",
            /**
             * @param {ServerHandle} context
             */
            exec: (handle, context, args) => {
                const worldId = args.length >= 1 ? parseInt(args[0]) || null : null;
                const routerType = args.length === 2 ? args[1] : null;
                const players = handle.listener.routers
                    .filter(v => v.hasPlayer && (routerType == null || v.type == routerType))
                    .map(v => v.player)
                    .filter(v => worldId == null || (v.hasWorld && v.world.id === worldId));
                handle.logger.print(table({
                    columns: [
                        { text: "ID",        headPad: " ", emptyPad: "/", rowPad: " ", separated: false },
                        { text: "WORLD",     headPad: " ", emptyPad: "/", rowPad: " ", separated: true  },
                        { text: "FOLLOWING", headPad: " ", emptyPad: "/", rowPad: " ", separated: false },
                        { text: "STATE",     headPad: " ", emptyPad: "/", rowPad: " ", separated: false },
                        { text: "SCORE",     headPad: " ", emptyPad: "/", rowPad: " ", separated: false },
                        { text: "NAME",      headPad: " ", emptyPad: "/", rowPad: " ", separated: false }
                    ],
                    rows: players.map((v) => {
                        let ret = [
                            v.id.toString(),
                            v.hasWorld ? v.world.id.toString() : null,
                        ];
                        if (v.type === "minion") ret.push(v.following.player.id.toString());
                        else if (v.hasWorld && v.state === 1) ret.push(v.world.largestPlayer.id.toString());
                        else ret.push(null);

                        switch (v.state) {
                            case -1: ret.push("idle"); break;
                            case 0:
                                ret.push("alive");
                                ret.push(Math.round(v.score).toString());
                                ret.push(v.leaderboardName);
                                break;
                            case 1: ret.push("spec"); break;
                            case 2: ret.push("roam"); break;
                        }
                        return ret;
                    })
                }, EOL));
            }
        }),
        genCommand({
            name: "stats",
            args: "",
            desc: "display critical information about the server",
            /**
             * @param {ServerHandle} context
             */
            exec: (handle, context, args) => {
                const logger = handle.logger;
                const memory = prettyMemoryData(process.memoryUsage());
                const external = handle.listener.connections.length;
                const internal = handle.listener.routers.length - external;
                if (!handle.running)
                    return void logger.print("not running");
                logger.print(`load:    ${handle.averageTickTime.toFixed(4)} ms / ${handle.tickDelay} ms`);
                logger.print(`memory:  ${memory.heapUsed} / ${memory.heapTotal} / ${memory.rss} / ${memory.external}`);
                logger.print(`uptime:  ${prettyTime(Math.floor((Date.now() - handle.startTime.getTime()) / 1000))}`);
                logger.print(`routers: ${external} external, ${internal} internal, ${external + internal} total`)
                logger.print(`players: ${Object.keys(handle.players).length}`);
                for (let id in handle.worlds) {
                    const world = handle.worlds[id], stats = world.stats,
                        cells = [ world.cells.length, world.playerCells.length, world.pelletCount, world.virusCount, world.ejectedCells.length, world.mothercellCount],
                        statsF = [ stats.external, stats.internal, stats.limit, stats.playing, stats.spectating ];
                    logger.print(`world ${id}: ${cells[0]} cells - ${cells[1]}P/${cells[2]}p/${cells[3]}v/${cells[4]}e/${cells[5]}m`);
                    logger.print(`         ${statsF[0]} / ${statsF[1]} / ${statsF[2]} players - ${statsF[3]}p/${statsF[4]}s`);
                }
            }
        }),
        genCommand({
            name: "setting",
            args: "<name> [value]",
            desc: "change/print the value of a setting",
            /**
             * @param {ServerHandle} context
             */
            exec: (handle, context, args) => {
                if (args.length < 1)
                    return void handle.logger.print("no setting name provided");
                const settingName = args[0];
                if (!handle.settings.hasOwnProperty(settingName)) {
                    const settingIdSplit = splitSettingId(settingName);
                    const possible = Object.keys(handle.settings)
                        .map(v => { return { name: v, hits: getSplitSettingHits(splitSettingId(v), settingIdSplit) }; })
                        .sort((a, b) => b.hits - a.hits)
                        .filter((v) => v.hits > 0)
                        .filter((v, i, array) => array[0].hits === v.hits)
                        .map(v => v.name);
                    let printing = "no such setting";
                    if (possible.length > 0) {
                        printing += `; did you mean ${possible.slice(0, 3).join(", ")}`
                        if (possible.length > 3) printing += `, ${possible.length - 3} other`;
                        printing += "?"
                    }
                    return void handle.logger.print(printing);
                }
                if (args.length >= 2) {
                    const settingValue = JSON.parse(args.slice(1).join(" "));
                    const newSettings = Object.assign({ }, handle.settings);
                    newSettings[settingName] = settingValue;
                    handle.setSettings(newSettings);
                }
                handle.logger.print(handle.settings[settingName]);
            }
        }),
        genCommand({
            name: "eval",
            args: "",
            desc: "evaluate javascript code in a function bound to server handle",
            /**
             * @param {ServerHandle} context
             */
            exec: (handle, context, args) => {
                const result = (function() {
                    try { return eval(args.join(" ")); }
                    catch (e) { return !e ? e : (e.stack || e); }
                }).bind(handle)();
                handle.logger.print(inspect(result, true, 1, false));
            }
        }),
        genCommand({
            name: "test",
            args: "",
            desc: "test command",
            /**
             * @param {ServerHandle} context
             */
            exec: (handle, context, args) => handle.logger.print("success successful")
        }),
        genCommand({
            name: "crash",
            args: "",
            desc: "manually force an error throw",
            /**
             * @param {ServerHandle} context
             */
            exec: (handle, context, args) => { throw new Error("manual crash"); }
        }),
        genCommand({
            name: "restart",
            args: "",
            desc: "stop then immediately start the handle",
            /**
             * @param {ServerHandle} context
             */
            exec: (handle, context, args) => {
                if (!handle.stop()) return void handle.logger.print("handle not started");
                handle.start();
            }
        }),
        genCommand({
            name: "pause",
            args: "",
            desc: "toggle handle pause",
            /**
             * @param {ServerHandle} context
             */
            exec: (handle, context, args) => {
                if (!handle.running) return void handle.logger.print("handle not started");
                if (handle.ticker.running)
                    handle.ticker.stop();
                else handle.ticker.start();
            }
        }),
        genCommand({
            name: "mass",
            args: "<id> <mass>",
            desc: "set cell mass to all of a player's cells",
            /**
             * @param {ServerHandle} context
             */
            exec: (handle, context, args) => {
                const player = getPlayerByID(args, handle, 0, true);
                const mass = getFloat(args, handle, 1, "mass");
                if (player === false || mass === false)
                    return;
                const l = player.ownedCells.length;
                for (let i = 0; i < l; i++) player.ownedCells[i].mass = mass;
                handle.logger.print(`player now has ${mass * l} mass`);
            }
        }),
        genCommand({
            name: "merge",
            args: "<id>",
            desc: "instantly merge a player",
            /**
             * @param {ServerHandle} context
             */
            exec: (handle, context, args) => {
                const player = getPlayerByID(args, handle, 0, true);
                if (player === false)
                    return;
                const l = player.ownedCells.length;
                let sqSize = 0;
                for (let i = 0; i < l; i++) sqSize += player.ownedCells[i].squareSize;
                player.ownedCells[0].squareSize = sqSize;
                player.ownedCells[0].x = player.viewArea.x;
                player.ownedCells[0].y = player.viewArea.y;
                for (let i = 1; i < l; i++) player.world.removeCell(player.ownedCells[1]);
                handle.logger.print(`merged player from ${l} cells and ${Math.round(sqSize / 100)} mass`);
            }
        }),
        genCommand({
            name: "kill",
            args: "<id>",
            desc: "instantly kill a player",
            /**
             * @param {ServerHandle} context
             */
            exec: (handle, context, args) => {
                const player = getPlayerByID(args, handle, 0, true);
                if (player === false)
                    return;
                for (let i = 0, l = player.ownedCells.length; i < l; i++)
                    player.world.removeCell(player.ownedCells[0]);
                handle.logger.print("player killed");
            }
        }),
        genCommand({
            name: "explode",
            args: "<id>",
            desc: "instantly explode a player's first cell",
            /**
             * @param {ServerHandle} context
             */
            exec: (handle, context, args) => {
                const player = getPlayerByID(args, handle, 0, true);
                if (player === false)
                    return;
                player.world.popPlayerCell(player.ownedCells[0]);
                handle.logger.print("player exploded");
            }
        }),
        genCommand({
            name: "addminion",
            args: "<id> [count]",
            desc: "assign minions to a player",
            /**
             * @param {ServerHandle} context
             */
            exec: (handle, context, args) => {
                if (args.length === 1) args[1] = "1";
                const player = getPlayerByID(args, handle, 0, false);
                const count = getInt(args, handle, 1, "count");
                if (player === false || count === false)
                    return;
                if (!player.router.isExternal)
                    return void handle.logger.print("player is not external");
                if (!player.hasWorld)
                    return void handle.logger.print("player is not in a world");
                for (let i = 0; i < count; i++) new Minion(player.router);
                handle.logger.print(`added ${count} minions to player`);
            }
        }),
        genCommand({
            name: "rmminion",
            args: "<id> [count]",
            desc: "remove assigned minions from a player",
            /**
             * @param {ServerHandle} context
             */
            exec: (handle, context, args) => {
                if (args.length === 1) args[1] = "1";
                const player = getPlayerByID(args, handle, 0, false);
                const count = getInt(args, handle, 1, "count");
                if (player === false || count === false)
                    return;
                if (!player.router.isExternal)
                    return void handle.logger.print("player is not external");
                if (!player.hasWorld)
                    return void handle.logger.print("player is not in a world");
                let realCount = 0;
                for (let i = 0; i < count && player.router.minions.length > 0; i++) {
                    player.router.minions[0].close();
                    realCount++;
                }
                handle.logger.print(`removed ${realCount} minions from player`);
            }
        }),
        genCommand({
            name: "killall",
            args: "<world id>",
            desc: "instantly kill all players in a world",
            /**
             * @param {ServerHandle} context
             */
            exec: (handle, context, args) => {
                const world = getWorldByID(args, handle, 0, false);
                if (world === false)
                    return;
                const players = world.players;
                for (let i = 0; i < players.length; i++) {
                    const player = players[i];
                    if (player.state !== 0) continue;
                    for (let j = 0, l = player.ownedCells.length; j < l; j++)
                        player.world.removeCell(player.ownedCells[0]);
                }
                handle.logger.print(`${players.length} player${players.length === 1 ? "" : "s"} killed`);
            }
        }),
        genCommand({
            name: "addbot",
            args: "<world id> [count=1]",
            desc: "assign player bots to a world",
            /**
             * @param {ServerHandle} context
             */
            exec: (handle, context, args) => {
                if (args.length === 1) args[1] = "1";

                const world = getWorldByID(args, handle, 0, false);
                const count = getInt(args, handle, 1, "count");
                if (world === false || count === false)
                    return;
                for (let i = 0; i < count; i++) new PlayerBot(world);
                handle.logger.print(`added ${count} player bots to world`);
            }
        }),
        genCommand({
            name: "rmbot",
            args: "<world id> [count=1]",
            desc: "remove player bots from a world",
            /**
             * @param {ServerHandle} context
             */
            exec: (handle, context, args) => {
                if (args.length === 1) args[1] = "1";

                const world = getWorldByID(args, handle, 0, false);
                const count = getInt(args, handle, 1, "count");
                if (world === false || count === false)
                    return;
                let realCount = 0;
                for (let i = 0, l = world.players.length; i < l && realCount < count; i++) {
                    if (world.players[i].router.type !== "playerbot") continue;
                    world.players[i].router.close();
                    realCount++; i--; l--;
                }
                handle.logger.print(`removed ${realCount} player bots from world`);
            }
        }),
        genCommand({
            name: "forbid",
            args: "<IP address / player id>",
            desc: "forbid (ban) specified IP or a connected player",
            /**
             * @param {ServerHandle} context
             */
            exec: (handle, context, args) => {
                if (args.length < 1)
                    return void handle.logger.print("");
                const id = getString(args, handle, 0, "IP address / player id");
                if (id === false)
                    return;
                let ip;
                if (!IPvalidate.test(ip = id)) {
                    if (!handle.players.hasOwnProperty(id))
                        return void handle.logger.print("no player has this id");
                    const player = handle.players[id];
                    if (!player.router.isExternal)
                        return void handle.logger.print("player is not external");
                    ip = player.router.remoteAddress;
                }
                handle.settings.listenerForbiddenIPs.push(ip);
                handle.logger.print(`IP address ${ip} is now forbidden`);
            }
        }),
        genCommand({
            name: "pardon",
            args: "<IP address>",
            desc: "pardon (unban) specified IP",
            /**
             * @param {ServerHandle} context
             */
            exec: (handle, context, args) => {
                if (args.length < 1)
                    return void handle.logger.print("");
                const id = getString(args, handle, 0, "IP address");
                if (id === false)
                    return;
                if (!IPvalidate.test(ip = id))
                    return void handle.logger.print("invalid IP address");
                const index = handle.settings.listenerForbiddenIPs.indexOf(ip);
                if (index === -1)
                    return void handle.logger.print("specified IP address is not forbidden");
                handle.settings.listenerForbiddenIPs.splice(index, 1);
                handle.logger.print(`IP address ${ip} has been pardoned`);
            }
        })
    );
    chatCommands.register(
        genCommand({
            name: "help",
            args: "",
            desc: "display all registered commands and their relevant information",
            /**
             * @param {Connection} context
             */
            exec: (handle, context, args) => {
                const list = handle.chatCommands.list;
                handle.listener.globalChat.directMessage(null, context, "available commands:");
                for (let name in list)
                    handle.listener.globalChat.directMessage(
                        null,
                        context,
                        `${name}${list[name].args.length > 0 ? " " : ""}${list[name].args} - ${list[name].description}`
                    );
            }
        }),
        genCommand({
            name: "id",
            args: "",
            desc: "get your id",
            /**
             * @param {Connection} context
             */
            exec: (handle, context, args) => {
                handle.listener.globalChat.directMessage(
                    null,
                    context,
                    context.hasPlayer ? `your ID is ${context.player.id}` : "you don't have a player associated with yourself"
                );
            }
        }),
        genCommand({
            name: "worldid",
            args: "",
            desc: "get your world's id",
            /**
             * @param {Connection} context
             */
            exec: (handle, context, args) => {
                const chat = handle.listener.globalChat;
                if (!context.hasPlayer)
                    return void chat.directMessage(null, context, "you don't have a player associated with yourself");
                if (!context.player.hasWorld)
                    return void chat.directMessage(null, context, "you're not in a world");
                chat.directMessage(
                    null,
                    context,
                    `your world ID is ${context.player.world.id}`
                );
            }
        }),
        genCommand({
            name: "leaveworld",
            args: "",
            desc: "leave your world",
            /**
             * @param {Connection} context
             */
            exec: (handle, context, args) => {
                const chat = handle.listener.globalChat;
                if (!context.hasPlayer)
                    return void chat.directMessage(null, context, "you don't have a player associated with yourself");
                if (!context.player.hasWorld)
                    return void chat.directMessage(null, context, "you're not in a world");
                context.player.world.removePlayer(context.player);
            }
        }),
        genCommand({
            name: "joinworld",
            args: "<id>",
            desc: "try to join a world",
            /**
             * @param {Connection} context
             */
            exec: (handle, context, args) => {
                const chat = handle.listener.globalChat;
                if (args.length === 0)
                    return void chat.directMessage(null, context, "missing world id argument");
                const id = parseInt(args[0]);
                if (isNaN(id))
                    return void chat.directMessage(null, context, "invalid world id number format");
                if (!context.hasPlayer)
                    return void chat.directMessage(null, context, "you don't have a player instance associated with yourself");
                if (context.player.hasWorld)
                    return void chat.directMessage(null, context, "you're already in a world");
                if (!handle.worlds.hasOwnProperty(id))
                    return void chat.directMessage(null, context, "this world doesn't exist");
                if (!handle.gamemode.canJoinWorld(handle.worlds[id]))
                    return void chat.directMessage(null, context, "you can't join this world");
                handle.worlds[id].addPlayer(context.player);
            }
        })
    );
};

const { CommandList } = require("./CommandList");
const ServerHandle = require("../ServerHandle");
const Connection = require("../sockets/Connection");
