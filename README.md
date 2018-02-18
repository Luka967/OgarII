# OgarII

**Ask all your questions over on the MultiOgar-Edited Discord guild**:

[![link](https://discordapp.com/api/guilds/407210435721560065/embed.png?style=banner2)](https://discord.gg/27v68Sb)

This is a full rewrite based off of Ogar/MultiOgar/MultiOgar-Edited that ended up being better than I originally expected. The code is clean and logical. The agar protocol is fully supported - up from version 4 all the way to 17.

## Running

1. You need a somewhat newer version of node as a lot of the code utilizes ES6 features that are shipped with them. If you get a random syntax error, try updating node to the LTS version first.

2. `git clone` or download&extract the repo contents.

3. Run `npm install` to install uWebSockets and json-beautify.

4. `cd cli/`

5. `node index.js` to create a default settings file at `cli/settings.json`. Again to start it.

## Configuring

- As mentioned above `cli/settings.json` is the way to go.

- To change logging settings, modify the `settings` constant variable at `cli/log-handler.js`.

## Expanding

- To add your own commands, check out `src/Commands.js` on the command API, then use the `ServerHandle.commands.register` function to finally add it. They can be added  no matter whether the handle's running or not.

- A similar principle works for gamemodes, except that you'd need to inherit `src/Gamemode.js`'s `Gamemode` abstract class, modify the gamemode's functions to your wish, then use `ServerHandle.gamemodes.register` to add your gamemode **before** the handle starts.

- The `ServerHandle` class is standalone, which means that you can completely ditch the `cli/` folder and build your own logging system, or go even further and make a handle for running multiple servers simultaneously and sharing a common statistics endpoint.

## Questions

The project is still under developement. The basics work as expected so you're encouraged to go bug hunting.

**DON'T** ask what additional features will it bring..

**DON'T** go around asking how do I do this how do I do that. You have the [MultiOgar-Edited Discord guild](https://discord.gg/27v68Sb) for that.

## Contributing

Pull requests are not welcome, OgarII-Chan is mine.