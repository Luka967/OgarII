/**
 * @template T
 */
class Command {
    /**
     * @param {string} name
     * @param {string} description
     * @param {string} args
     * @param {(handle: ServerHandle, context: T, args: string[]) => void} executor
     */
    constructor(name, description, args, executor) {
        this.name = name.toLowerCase();
        this.description = description;
        this.args = args;
        this.executor = executor;
    }

    toString() {
        return `${this.name}${!this.args ? "" : " " + this.args} - ${this.description}`;
    }
}

/**
 * @template T
 */
class CommandList {
    constructor(handle) {
        this.handle = handle;
        /** @type {{[commandName: string]: Command}} */
        this.list = { };
    }

    /**
     * @param {Command[]} commands
     */
    register(...commands) {
        for (let i = 0, l = commands.length; i < l; i++) {
            const command = commands[i];
            if (this.list.hasOwnProperty(command)) throw new Error("command conflicts with another already registered one");
            this.list[command.name] = command;
        }
    }

    /**
     * @param {T} context
     * @param {string} input
     */
    execute(context, input) {
        const split = input.split(" ");
        if (split.length === 0) return false;
        if (!this.list.hasOwnProperty(split[0].toLowerCase())) return false;
        this.list[split[0].toLowerCase()].executor(this.handle, context, split.slice(1));
        return true;
    }
}

module.exports = {
    Command: Command,
    CommandList: CommandList,
    /**
     * @template T
     * @param {{ args: string, desc: string, name: string, exec: (handle: ServerHandle, context: T, args: string[]) => void }} info
     */
    genCommand(info) {
        return new Command(info.name, info.desc, info.args, info.exec);
    }
};

const ServerHandle = require("../ServerHandle");
