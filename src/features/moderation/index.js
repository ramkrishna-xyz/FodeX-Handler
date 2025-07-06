const Feature = require('../../structures/Feature');

module.exports = class Moderation extends Feature {
    constructor(client) {
        super(client, {
            name: 'Moderation',
            description: 'Server moderation tools',
            category: 'Moderation',
            dependencies: ['database']
        });
    }
    
    async initialize() {
        this.client.logger.debug('Initializing moderation system...');
        
        // Load moderation commands
        const moderationCommands = require('./commands');
        for (const command of moderationCommands) {
            this.client.commands.set(command.name, command);
            if (command.slashCommand) {
                this.client.slashCommands.set(command.name, command.slashData);
            }
        }
        
        // Load mute scheduler
        this.loadMutes();
        
        this.client.logger.info('Moderation system ready');
    }
    
    async loadMutes() {
        try {
            const activeMutes = await this.client.models.Mute.find({ expires: { $gt: new Date() } });
            
            for (const mute of activeMutes) {
                this.scheduleUnmute(mute);
            }
        } catch (error) {
            this.client.logger.error('Error loading active mutes:', error);
        }
    }
    
    scheduleUnmute(mute) {
        const now = new Date();
        const duration = mute.expires - now;
        
        if (duration <= 0) {
            this.unmuteUser(mute.userId, mute.guildId);
            return;
        }
        
        const timeout = setTimeout(async () => {
            await this.unmuteUser(mute.userId, mute.guildId);
        }, duration);
        
        this.client.cache.mutes.set(`${mute.guildId}-${mute.userId}`, timeout);
    }
    
    async unmuteUser(userId, guildId) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) return;
            
            const member = await guild.members.fetch(userId).catch(() => null);
            if (!member) return;
            
            const muteRole = guild.roles.cache.find(r => r.name === this.client.config.moderation.muteRole);
            if (!muteRole) return;
            
            await member.roles.remove(muteRole);
            await this.client.models.Mute.deleteOne({ userId, guildId });
            this.client.cache.mutes.delete(`${guildId}-${userId}`);
            
            // Log to mod logs
            const logChannel = guild.channels.cache.find(c => 
                c.name === this.client.config.moderation.modLogChannel && 
                c.type === 'GUILD_TEXT'
            );
            
            if (logChannel) {
                logChannel.send({
                    embeds: [this.client.embed()
                        .setTitle('Member Unmuted')
                        .setDescription(`<@${userId}> has been automatically unmuted`)
                        .setColor(this.client.config.colors.success)
                        .setTimestamp()
                    ]
                });
            }
        } catch (error) {
            this.client.logger.error('Error unmuting user:', error);
        }
    }
    
    // Other moderation methods...
};