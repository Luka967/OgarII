module.exports = {
    ServerHandle: require("./src/ServerHandle"),
    Router: require("./src/sockets/Router"),
    Protocol: require("./src/protocols/Protocol"),
    Command: require("./src/commands/CommandList").Command,
    Gamemode: require("./src/gamemodes/Gamemode"),

    base: {
        commands: require("./src/commands/DefaultCommands"),
        protocols: [
            require("./src/protocols/LegacyProtocol"),
            require("./src/protocols/ModernProtocol")
        ],
        gamemodes: [
            require("./src/gamemodes/FFA"),
            require("./src/gamemodes/Teams"),
            require("./src/gamemodes/LastManStanding")
        ]
    }
};
