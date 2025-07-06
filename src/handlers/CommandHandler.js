const path = require('path');
const fs = require('fs');
const { Collection } = require('discord.js');

module.exports = class CommandHandler {
    constructor(client) {
        this.client = client;
        this.commandsPath = path.join(__dirname, '../commands');
    }
    
    async loadCommands() {
        this.client.logger.info('Loading commands...');
        
        const commandFolders = fs.readdirSync(this.commandsPath);
        
        for (const folder of commandFolders) {
            const folderPath = path.join(this.commandsPath, folder);
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);
                const command = require(filePath);
                
                if (!command.name) {
                    this.client.logger.warn(`Command ${file} is missing a name!`);
                    continue;
                }
                
                // Add command to collections
                this.client.commands.set(command.name, command);
                
                // Add aliases
                if (command.aliases && Array.isArray(command.aliases)) {
                    command.aliases.forEach(alias => {
                        this.client.aliases.set(alias, command.name);
                    });
                }
                
                // Add slash command if enabled
                if (command.slashCommand) {
                    this.client.slashCommands.set(command.name, command.slashData);
                }
                
                this.client.logger.debug(`Loaded command: ${command.name}`);
            }
        }
        
        this.client.logger.info(`Successfully loaded ${this.client.commands.size} commands`);
    }
    
    async handleCommand(message) {
        if (message.author.bot || !message.guild) return;
        
        const prefix = this.client.config.prefix;
        if (!message.content.startsWith(prefix)) return;
        
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        const command = this.client.commands.get(commandName) || 
                       this.client.commands.get(this.client.aliases.get(commandName));
        
        if (!command) return;
        
        // Check if command is guild only
        if (command.guildOnly && !message.guild) {
            return message.reply('This command can only be used in a server!');
        }
        
        // Check if command is owner only
        if (command.ownerOnly && !this.client.config.owners.includes(message.author.id)) {
            return message.reply('This command can only be used by the bot owner!');
        }
        
        // Check if command is NSFW and channel is NSFW
        if (command.nsfw && !message.channel.nsfw) {
            return message.reply('This command can only be used in NSFW channels!');
        }
        
        // Check user permissions
        if (command.userPerms && command.userPerms.length > 0) {
            const missingPerms = message.member.permissions.missing(command.userPerms);
            if (missingPerms.length > 0) {
                return message.reply(`You need the following permissions: ${missingPerms.map(p => `\`${p}\``).join(', ')}`);
            }
        }
        
        // Check bot permissions
        if (command.botPerms && command.botPerms.length > 0) {
            const missingPerms = message.guild.members.me.permissions.missing(command.botPerms);
            if (missingPerms.length > 0) {
                return message.reply(`I need the following permissions: ${missingPerms.map(p => `\`${p}\``).join(', ')}`);
            }
        }
        
        // Check args
        if (command.args && args.length < command.minArgs) {
            return message.reply(`You need to provide at least ${command.minArgs} arguments!\nUsage: \`${this.client.config.prefix}${command.name} ${command.usage}\``);
        }
        
        if (command.maxArgs !== null && args.length > command.maxArgs) {
            return message.reply(`You can only provide up to ${command.maxArgs} arguments!\nUsage: \`${this.client.config.prefix}${command.name} ${command.usage}\``);
        }
        
        // Cooldown system
        if (!this.client.cooldowns.has(command.name)) {
            this.client.cooldowns.set(command.name, new Collection());
        }
        
        const now = Date.now();
        const timestamps = this.client.cooldowns.get(command.name);
        const cooldownAmount = command.cooldown || this.client.config.cooldowns.default;
        
        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply(`Please wait ${timeLeft.toFixed(1)} more seconds before reusing the \`${command.name}\` command.`);
            }
        }
        
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        
        // Execute command
        try {
            await command.execute(message, args, this.client);
        } catch (error) {
            this.client.logger.error(`Error executing command ${command.name}:`, error);
            message.reply('There was an error trying to execute that command!');
        }
    }
};