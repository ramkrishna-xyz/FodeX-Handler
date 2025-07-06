module.exports = class Command {
    constructor(options) {
        this.name = options.name || null;
        this.description = options.description || 'No description provided';
        this.category = options.category || 'Miscellaneous';
        this.usage = options.usage || '';
        this.aliases = options.aliases || [];
        this.userPerms = options.userPerms || [];
        this.botPerms = options.botPerms || [];
        this.cooldown = options.cooldown || 3000;
        this.ownerOnly = options.ownerOnly || false;
        this.guildOnly = options.guildOnly || false;
        this.nsfw = options.nsfw || false;
        this.args = options.args || false;
        this.minArgs = options.minArgs || 0;
        this.maxArgs = options.maxArgs || null;
        
        // Slash command options
        this.slashCommand = options.slashCommand || false;
        this.slashData = options.slashData || {
            name: this.name,
            description: this.description,
            options: []
        };
    }
    
    async execute(message, args, client) {
        throw new Error(`Command ${this.name} doesn't have an execute method!`);
    }
    
    async runSlash(interaction, client) {
        throw new Error(`Slash command ${this.name} doesn't have a runSlash method!`);
    }
};