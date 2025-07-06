const { Client, Collection } = require('discord.js');
const config = require('../config');
const Logger = require('../utils/Logger');
const DatabaseHandler = require('../handlers/DatabaseHandler');
const FeatureHandler = require('../handlers/FeatureHandler');

class ExtendedClient extends Client {
    constructor() {
        super({
            intents: [
                'Guilds',
                'GuildMembers',
                'GuildMessages',
                'GuildMessageReactions',
                'GuildVoiceStates',
                'MessageContent',
                'GuildPresences',
                'GuildInvites'
            ],
            allowedMentions: {
                repliedUser: false
            }
        });
        
        this.config = config;
        this.logger = new Logger(config.logging.level, config.logging.file);
        
        // Collections
        this.commands = new Collection();
        this.aliases = new Collection();
        this.cooldowns = new Collection();
        this.slashCommands = new Collection();
        this.contextMenus = new Collection();
        this.buttons = new Collection();
        this.modals = new Collection();
        this.selectMenus = new Collection();
        this.features = new Collection();
        
        // Handlers
        this.database = new DatabaseHandler(this);
        this.featureHandler = new FeatureHandler(this);
        
        // Utilities
        this.embed = require('../utils/EmbedBuilder');
        this.paginator = require('../utils/Paginator');
        this.permissions = require('../utils/PermissionManager');
        
        // Data models
        this.models = {
            User: require('../structures/models/User'),
            Guild: require('../structures/models/Guild'),
            Economy: require('../structures/models/Economy'),
            Level: require('../structures/models/Level'),
            Warn: require('../structures/models/Warn')
        };
        
        // Cache
        this.cache = {
            mutes: new Collection(),
            reminders: new Collection(),
            giveaways: new Collection(),
            musicPlayers: new Collection()
        };
    }
    
    async start() {
        try {
            // Connect to database first
            await this.database.connect();
            
            // Initialize handlers
            await this.featureHandler.loadFeatures();
            
            // Login to Discord
            await this.login(this.config.token);
            
            // Start web dashboard if enabled
            if (this.config.dashboard.enabled) {
                require('../dashboard/server')(this);
            }
        } catch (error) {
            this.logger.error('Failed to start bot:', error);
            process.exit(1);
        }
    }
}

module.exports = ExtendedClient;