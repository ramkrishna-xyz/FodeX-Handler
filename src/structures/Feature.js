module.exports = class Feature {
    constructor(client) {
        this.client = client;
        this.name = '';
        this.description = '';
        this.category = '';
        this.dependencies = [];
    }
    
    async initialize() {
        throw new Error(`Feature ${this.name} doesn't have an initialize method!`);
    }
    
    async enable(guildId) {
        // Enable feature for a specific guild
    }
    
    async disable(guildId) {
        // Disable feature for a specific guild
    }
};