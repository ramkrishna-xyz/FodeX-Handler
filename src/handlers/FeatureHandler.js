const path = require('path');
const fs = require('fs');

module.exports = class FeatureHandler {
    constructor(client) {
        this.client = client;
        this.featuresPath = path.join(__dirname, '../features');
    }
    
    async loadFeatures() {
        this.client.logger.info('Loading features...');
        
        const featureFolders = fs.readdirSync(this.featuresPath);
        
        for (const folder of featureFolders) {
            // Check if feature is enabled in config
            if (this.client.config.features[folder] === false) {
                this.client.logger.debug(`Feature ${folder} is disabled, skipping...`);
                continue;
            }
            
            const featurePath = path.join(this.featuresPath, folder, 'index.js');
            
            if (!fs.existsSync(featurePath)) {
                this.client.logger.warn(`Feature ${folder} is missing index.js!`);
                continue;
            }
            
            const Feature = require(featurePath);
            const feature = new Feature(this.client);
            
            if (!feature.name) {
                this.client.logger.warn(`Feature ${folder} is missing a name!`);
                continue;
            }
            
            // Initialize feature
            try {
                await feature.initialize();
                this.client.features.set(feature.name, feature);
                this.client.logger.info(`Loaded feature: ${feature.name}`);
            } catch (error) {
                this.client.logger.error(`Failed to load feature ${folder}:`, error);
            }
        }
    }
};