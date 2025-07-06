const Command = require('../../structures/Command');

module.exports = class PingCommand extends Command {
    constructor() {
        super({
            name: 'ping',
            description: 'Check the bot\'s ping',
            category: 'General',
            cooldown: 5000,
            slashCommand: true,
            slashData: {
                name: 'ping',
                description: 'Check the bot\'s ping'
            }
        });
    }
    
    async execute(message, args, client) {
        const msg = await message.reply('Pinging...');
        const latency = msg.createdTimestamp - message.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);
        
        msg.edit(`🏓 Pong!\nBot Latency: \`${latency}ms\`\nAPI Latency: \`${apiLatency}ms\``);
    }
    
    async runSlash(interaction, client) {
        await interaction.reply('Pinging...');
        const reply = await interaction.fetchReply();
        const latency = reply.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);
        
        interaction.editReply(`🏓 Pong!\nBot Latency: \`${latency}ms\`\nAPI Latency: \`${apiLatency}ms\``);
    }
};