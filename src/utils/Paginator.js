const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = class Paginator {
    constructor(interaction, pages, options = {}) {
        this.interaction = interaction;
        this.pages = pages;
        this.options = {
            timeout: options.timeout || 60000,
            ephemeral: options.ephemeral || false,
            filter: options.filter || (i => i.user.id === interaction.user.id),
            buttons: options.buttons || {
                first: true,
                back: true,
                next: true,
                last: true,
                close: true
            }
        };
        
        this.currentPage = options.startPage || 0;
        this.message = null;
    }
    
    async start() {
        if (!this.pages.length) throw new Error('No pages provided');
        
        const row = this.createButtons();
        this.message = await this.interaction.reply({
            embeds: [this.pages[this.currentPage]],
            components: [row],
            fetchReply: true,
            ephemeral: this.options.ephemeral
        });
        
        this.collector = this.message.createMessageComponentCollector({
            filter: this.options.filter,
            time: this.options.timeout
        });
        
        this.collector.on('collect', async i => {
            switch (i.customId) {
                case 'first':
                    this.currentPage = 0;
                    break;
                case 'back':
                    this.currentPage = Math.max(0, this.currentPage - 1);
                    break;
                case 'next':
                    this.currentPage = Math.min(this.pages.length - 1, this.currentPage + 1);
                    break;
                case 'last':
                    this.currentPage = this.pages.length - 1;
                    break;
                case 'close':
                    this.collector.stop();
                    return;
            }
            
            await i.update({
                embeds: [this.pages[this.currentPage]],
                components: [this.createButtons()]
            });
        });
        
        this.collector.on('end', () => {
            if (!this.message.editable) return;
            this.message.edit({ components: [] }).catch(() => null);
        });
    }
    
    createButtons() {
        const row = new ActionRowBuilder();
        
        if (this.options.buttons.first) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('first')
                    .setLabel('«')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(this.currentPage === 0)
            );
        }
        
        if (this.options.buttons.back) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('back')
                    .setLabel('‹')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(this.currentPage === 0)
            );
        }
        
        if (this.options.buttons.next) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('›')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(this.currentPage === this.pages.length - 1)
            );
        }
        
        if (this.options.buttons.last) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('last')
                    .setLabel('»')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(this.currentPage === this.pages.length - 1)
            );
        }
        
        if (this.options.buttons.close) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('close')
                    .setLabel('Close')
                    .setStyle(ButtonStyle.Danger)
            );
        }
        
        return row;
    }
};