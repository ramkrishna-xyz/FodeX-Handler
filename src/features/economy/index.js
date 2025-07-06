const Feature = require('../../structures/Feature');

module.exports = class Economy extends Feature {
    constructor(client) {
        super(client, {
            name: 'Economy',
            description: 'Server economy system with currency, jobs, and shops',
            category: 'Economy',
            dependencies: ['database']
        });
    }
    
    async initialize() {
        this.client.logger.debug('Initializing economy system...');
        
        // Load economy commands
        const economyCommands = require('./commands');
        for (const command of economyCommands) {
            this.client.commands.set(command.name, command);
            if (command.slashCommand) {
                this.client.slashCommands.set(command.name, command.slashData);
            }
        }
        
        // Load economy events
        this.client.on('messageCreate', this.handleMessage.bind(this));
        
        this.client.logger.info('Economy system ready');
    }
    
    async handleMessage(message) {
        if (message.author.bot || !message.guild) return;
        
        // Add money for active participation
        try {
            const userData = await this.client.models.Economy.findOne({ userId: message.author.id, guildId: message.guild.id });
            
            if (!userData) {
                await this.client.models.Economy.create({
                    userId: message.author.id,
                    guildId: message.guild.id,
                    balance: this.client.config.economy.startingBalance || 100
                });
                return;
            }
            
            // Random chance to earn money per message
            if (Math.random() < 0.3) {
                const amount = Math.floor(Math.random() * 10) + 5;
                userData.balance += amount;
                await userData.save();
            }
        } catch (error) {
            this.client.logger.error('Error handling economy message:', error);
        }
    }
    
    // Other economy methods...
};