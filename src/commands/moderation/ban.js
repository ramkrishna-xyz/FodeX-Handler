const Command = require('../../structures/Command');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = class BanCommand extends Command {
    constructor() {
        super({
            name: 'ban',
            description: 'Bans a member from the server',
            category: 'Moderation',
            userPerms: ['BanMembers'],
            botPerms: ['BanMembers'],
            slashCommand: true,
            slashData: {
                name: 'ban',
                description: 'Bans a member from the server',
                options: [
                    {
                        name: 'member',
                        description: 'The member to ban',
                        type: 'USER',
                        required: true
                    },
                    {
                        name: 'reason',
                        description: 'Reason for the ban',
                        type: 'STRING',
                        required: false
                    },
                    {
                        name: 'days',
                        description: 'Number of days of messages to delete (0-7)',
                        type: 'INTEGER',
                        required: false,
                        min_value: 0,
                        max_value: 7
                    }
                ]
            }
        });
    }
    
    async execute(message, args, client) {
        const member = message.mentions.members.first() || 
                      await message.guild.members.fetch(args[0]).catch(() => null);
        
        if (!member) return message.reply('Please mention a valid member to ban.');
        
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        // Confirmation buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm-ban')
                    .setLabel('Confirm Ban')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancel-ban')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        const msg = await message.reply({
            content: `Are you sure you want to ban ${member.user.tag}?`,
            components: [row]
        });
        
        const filter = i => i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 15000 });
        
        collector.on('collect', async i => {
            if (i.customId === 'confirm-ban') {
                try {
                    await member.ban({ reason, days: 7 });
                    
                    // Log to database
                    await client.models.Warn.create({
                        guildId: message.guild.id,
                        userId: member.id,
                        moderatorId: message.author.id,
                        action: 'ban',
                        reason,
                        timestamp: new Date()
                    });
                    
                    // Log to mod logs
                    const logChannel = message.guild.channels.cache.find(c => 
                        c.name === client.config.moderation.modLogChannel && 
                        c.type === 'GUILD_TEXT'
                    );
                    
                    if (logChannel) {
                        logChannel.send({
                            embeds: [client.embed()
                                .setTitle('Member Banned')
                                .setDescription(`**User:** ${member.user.tag} (${member.id})\n**Moderator:** ${message.author.tag}\n**Reason:** ${reason}`)
                                .setColor(client.config.colors.error)
                                .setTimestamp()
                            ]
                        });
                    }
                    
                    await i.update({ content: `${member.user.tag} has been banned.`, components: [] });
                } catch (error) {
                    client.logger.error('Error banning member:', error);
                    await i.update({ content: 'Failed to ban member.', components: [] });
                }
            } else {
                await i.update({ content: 'Ban cancelled.', components: [] });
            }
            
            collector.stop();
        });
        
        collector.on('end', () => {
            if (!msg.editable) return;
            msg.edit({ components: [] }).catch(() => null);
        });
    }
    
    async runSlash(interaction, client) {
        const member = interaction.options.getMember('member');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const days = interaction.options.getInteger('days') || 0;
        
        if (!member.bannable) {
            return interaction.reply({ content: 'I cannot ban this member.', ephemeral: true });
        }
        
        try {
            await member.ban({ reason, days });
            
            // Log to database
            await client.models.Warn.create({
                guildId: interaction.guild.id,
                userId: member.id,
                moderatorId: interaction.user.id,
                action: 'ban',
                reason,
                timestamp: new Date()
            });
            
            // Log to mod logs
            const logChannel = interaction.guild.channels.cache.find(c => 
                c.name === client.config.moderation.modLogChannel && 
                c.type === 'GUILD_TEXT'
            );
            
            if (logChannel) {
                logChannel.send({
                    embeds: [client.embed()
                        .setTitle('Member Banned')
                        .setDescription(`**User:** ${member.user.tag} (${member.id})\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}`)
                        .setColor(client.config.colors.error)
                        .setTimestamp()
                    ]
                });
            }
            
            await interaction.reply({ content: `${member.user.tag} has been banned.`, ephemeral: true });
        } catch (error) {
            client.logger.error('Error banning member:', error);
            await interaction.reply({ content: 'Failed to ban member.', ephemeral: true });
        }
    }
};