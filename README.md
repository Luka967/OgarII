# OgarII

**If you're trying to connect through agar.io, you need to run `core.disableIntegrityChecks(true);` in the console**.

**Ask all your questions over on the Agar.io Private Servers guild**:

[![link](https://discordapp.com/api/guilds/407210435721560065/embed.png?style=banner2)](https://discord.gg/msMVwQC)

This is a full rewrite based off of Ogar/MultiOgar/MultiOgar-Edited that ended up being better than I originally expected. The code is clean and logical. The agar protocol is fully supported - up from version 4 all the way to 17.

## Running

1. You need a somewhat newer version of node as a lot of the code utilizes ES6 features that are shipped with them. If you get a random syntax error, try updating node to the LTS version first.

2. `git clone` or download&extract the repo contents.

3. Run `npm install` to install uWebSockets and json-beautify.

4. `cd cli/`

5. `node index.js`

## Configuring

- `cli/settings.json` is the way to go.

- To change logging settings, modify `cli/log-settings.json`.

## Expanding

- To add your own commands, check out `src/Commands.js` on the command API, then use the `ServerHandle.commands.register` function to finally add it. They can be added no matter whether the handle's running or not.

- A similar principle works for gamemodes, except that you'd need to inherit `src/Gamemode.js`'s `Gamemode` abstract class, modify the gamemode's functions to your wish, then use `ServerHandle.gamemodes.register` to add your gamemode **before** the handle starts.

- The `ServerHandle` class is standalone, which means that you can completely ditch the `cli/` folder and build your own logging system, or go even further and make a handle for running multiple servers simultaneously and sharing a common statistics endpoint.

## Questions

Ask questions about running, modifying & expanding in the [Agar.io Private Servers guild](https://discord.gg/27v68Sb).

**DON'T** ask what additional features will it bring.

**DON'T** go around asking ME how do I do this how do I do that. I'm not the Red Cross, nor your personal tech assistant, nor your paid developer.

## Contributing

Pull requests are not welcome.
