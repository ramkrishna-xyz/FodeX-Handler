module.exports = {
    customId: 'example-button',
    
    async execute(interaction, client) {
        await interaction.reply({ 
            content: 'You clicked the example button!', 
            ephemeral: true 
        });
    }
};