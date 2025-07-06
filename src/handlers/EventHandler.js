const path = require('path');
const fs = require('fs');

module.exports = class EventHandler {
    constructor(client) {
        this.client = client;
        this.eventsPath = path.join(__dirname, '../events');
    }
    
    async loadEvents() {
        this.client.logger.info('Loading events...');
        
        const eventFiles = fs.readdirSync(this.eventsPath).filter(file => file.endsWith('.js'));
        
        for (const file of eventFiles) {
            const filePath = path.join(this.eventsPath, file);
            const event = require(filePath);
            const eventName = file.split('.')[0];
            
            if (!eventName) {
                this.client.logger.warn(`Event ${file} is missing a name!`);
                continue;
            }
            
            if (event.once) {
                this.client.once(eventName, (...args) => event.execute(...args, this.client));
            } else {
                this.client.on(eventName, (...args) => event.execute(...args, this.client));
            }
            
            this.client.logger.debug(`Loaded event: ${eventName}`);
        }
        
        this.client.logger.info(`Successfully loaded ${eventFiles.length} events`);
    }
};