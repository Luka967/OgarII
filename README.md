# OgarII

Your friendly agar.io private server recreation.

- It supports all current agar.io protocol versions (4 - 18).

- It supports handling multiple worlds, all within one instance. Be wary that you can still use up the one CPU core node.js is running.

- It has a minimal memory footprint, and strictly uses uWebSockets for networking.

- The code uses JSDoc to specify types. Understanding what the code does is down to your understanding of English.

- It is customizable for your quality of life even without plugins, which are about to come soon.

## Notes

- Before connecting from agar.io you will need to do `core.disableIntegrityChecks(true)` in the console.

- OgarII supports a custom protocol made by Luka. To use it, clone the [modern branch](https://github.com/Luka967/Cigar/tree/modern) of [Luka967/Cigar](https://github.com/Luka967/Cigar).

- Ask all your questions over on the [Agar.io Private Servers](https://discord.gg/66X2ESb) guild.

[![link](https://discordapp.com/api/guilds/407210435721560065/embed.png?style=banner2)](https://discord.gg/66X2ESb)

## Running

1. Make sure you have node.js version 8 or greater.

2. Make sure you have a C++11 compliant compiler for building uWebSockets. If you fail compiling the package on Windows, `npm install -g windows-build-tools`.

3. Clone / [download](https://github.com/Luka967/OgarII/archive/master.zip) the repo.

4. `npm install` in `/`.

5. `cd ./cli/`

6. `node index.js`

## Configuring

- After your first run, OgarII will drop two files in `cli/` / working directory: `log-settings.json` and `settings.json`.

- To change how OgarII runs, modify `cli/settings.json`.

- To change what gets logged, modify `cli/log-settings.json`.

## Expanding

- To create your own commands, check out `src/commands/CommandList.js` on the command API. To add it to the CLI use `ServerHandle.commands.register`, and for chat commands use `ServerHandle.chatCommands.register`.

- To create your own gamemodes, inherit `src/Gamemode.js`'s `Gamemode` abstract class, modify event handling to your wish, then add it with `ServerHandle.gamemodes.register` before the handle starts.

- The `ServerHandle` class is standalone, which means that you can completely ditch the `cli/` folder, `require("./src/ServerHandle.js")` and do whatever you want with it.

## PSA

- Pull requests are not welcome.

- **DON'T** ask what additional features will it bring.

- **DON'T** go around asking ME how do I do this how do I do that. I'm not the Red Cross, nor your personal tech assistant, nor your paid developer.

## Available commands

```
NAME       ARGUMENTS            | DESCRIPTION
addbot     <world id> [count=1] | assign player bots to a world
addminion  <id> [count=1]       | assign minions to a player
eval                            | evaluate javascript code in the context of the handle and print the output
exit                            | stop the handle and close the command stream
help                            | display all registered commands and their relevant information
kill       <id>                 | instantly kill a player
killbot    <world id> [count=1] | remove player bots from a world
killminion <id> [count=1]       | remove assigned minions from a player
mass       <id> <mass>          | set cell mass to all of a player's cells
merge      <id>                 | instantly merge a player
pause                           | pause the server
pop        <id>                 | instantly pop a player's first cell
reload                          | reload the settings from local settings.json
restart                         | restart the server
resume                          | unpause the server
routers    [router type]        | display information about routers and their players
save                            | save the current settings to settings.json
setting    <name> [value]       | change/print the value of a setting
start                           | start the server
stats                           | display critical information about the server
stop                            | close the server
test                            | test command
```

### `routers` column explanation

`N` - router's index
`TYPE` - router type (connection, playerbot, minion)
`PRT` - router's protocol, if a connection
`P` - does the router have a player
`PID` - player id
`FID` - following player id, if minion or spectating
`STATE` - player's state
`WID` - player's world id
`SCORE` - player's mass sum
`NAME` - player's first owned cell name