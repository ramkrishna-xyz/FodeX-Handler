const path = require('path');
const fs = require('fs');
const { Collection } = require('discord.js');

module.exports = class InteractionHandler {
    constructor(client) {
        this.client = client;
        this.interactionsPath = path.join(__dirname, '../interactions');
    }
    
    async loadInteractions() {
        this.client.logger.info('Loading interactions...');
        
        const interactionTypes = ['buttons', 'modals', 'selectMenus', 'contextMenus'];
        
        for (const type of interactionTypes) {
            const typePath = path.join(this.interactionsPath, type);
            
            if (!fs.existsSync(typePath)) {
                this.client.logger.debug(`No ${type} folder found, skipping...`);
                continue;
            }
            
            const interactionFiles = fs.readdirSync(typePath).filter(file => file.endsWith('.js'));
            
            for (const file of interactionFiles) {
                const filePath = path.join(typePath, file);
                const interaction = require(filePath);
                
                if (!interaction.customId) {
                    this.client.logger.warn(`Interaction ${file} is missing a customId!`);
                    continue;
                }
                
                // Add to appropriate collection
                switch (type) {
                    case 'buttons':
                        this.client.buttons.set(interaction.customId, interaction);
                        break;
                    case 'modals':
                        this.client.modals.set(interaction.customId, interaction);
                        break;
                    case 'selectMenus':
                        this.client.selectMenus.set(interaction.customId, interaction);
                        break;
                    case 'contextMenus':
                        this.client.contextMenus.set(interaction.customId, interaction);
                        break;
                }
                
                this.client.logger.debug(`Loaded ${type} interaction: ${interaction.customId}`);
            }
        }
        
        this.client.logger.info('Successfully loaded interactions');
    }
    
    async handleInteraction(interaction) {
        if (interaction.isCommand()) {
            await this.handleSlashCommand(interaction);
        } else if (interaction.isContextMenu()) {
            await this.handleContextMenu(interaction);
        } else if (interaction.isButton()) {
            await this.handleButton(interaction);
        } else if (interaction.isModalSubmit()) {
            await this.handleModal(interaction);
        } else if (interaction.isSelectMenu()) {
            await this.handleSelectMenu(interaction);
        }
    }
    
    async handleSlashCommand(interaction) {
        const command = this.client.commands.get(interaction.commandName);
        
        if (!command) {
            this.client.logger.warn(`Slash command ${interaction.commandName} not found!`);
            return interaction.reply({ content: 'Command not found!', ephemeral: true });
        }
        
        try {
            await command.runSlash(interaction, this.client);
        } catch (error) {
            this.client.logger.error(`Error executing slash command ${command.name}:`, error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
    
    async handleContextMenu(interaction) {
        const contextCommand = this.client.contextMenus.get(interaction.commandName);
        
        if (!contextCommand) {
            this.client.logger.warn(`Context menu command ${interaction.commandName} not found!`);
            return interaction.reply({ content: 'Command not found!', ephemeral: true });
        }
        
        try {
            await contextCommand.execute(interaction, this.client);
        } catch (error) {
            this.client.logger.error(`Error executing context menu ${interaction.commandName}:`, error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
    
    async handleButton(interaction) {
        const button = this.client.buttons.get(interaction.customId);
        
        if (!button) {
            this.client.logger.warn(`Button ${interaction.customId} not found!`);
            return interaction.reply({ content: 'This button is invalid!', ephemeral: true });
        }
        
        try {
            await button.execute(interaction, this.client);
        } catch (error) {
            this.client.logger.error(`Error executing button ${interaction.customId}:`, error);
            await interaction.reply({ content: 'There was an error while handling this button!', ephemeral: true });
        }
    }
    
    async handleModal(interaction) {
        const modal = this.client.modals.get(interaction.customId);
        
        if (!modal) {
            this.client.logger.warn(`Modal ${interaction.customId} not found!`);
            return interaction.reply({ content: 'This modal is invalid!', ephemeral: true });
        }
        
        try {
            await modal.execute(interaction, this.client);
        } catch (error) {
            this.client.logger.error(`Error executing modal ${interaction.customId}:`, error);
            await interaction.reply({ content: 'There was an error while handling this modal!', ephemeral: true });
        }
    }
    
    async handleSelectMenu(interaction) {
        const selectMenu = this.client.selectMenus.get(interaction.customId);
        
        if (!selectMenu) {
            this.client.logger.warn(`Select menu ${interaction.customId} not found!`);
            return interaction.reply({ content: 'This select menu is invalid!', ephemeral: true });
        }
        
        try {
            await selectMenu.execute(interaction, this.client);
        } catch (error) {
            this.client.logger.error(`Error executing select menu ${interaction.customId}:`, error);
            await interaction.reply({ content: 'There was an error while handling this select menu!', ephemeral: true });
        }
    }
    
    async deploySlashCommands() {
        this.client.logger.info('Deploying slash commands...');
        
        try {
            const commands = [];
            
            // Add slash commands
            this.client.slashCommands.forEach(command => {
                commands.push(command);
            });
            
            // Add context menus
            this.client.contextMenus.forEach(menu => {
                commands.push({
                    name: menu.customId,
                    type: menu.type === 'USER' ? 2 : 3 // 2 = user, 3 = message
                });
            });
            
            // Deploy globally
            await this.client.application.commands.set(commands);
            this.client.logger.info('Successfully deployed slash commands globally');
        } catch (error) {
            this.client.logger.error('Failed to deploy slash commands:', error);
        }
    }
};