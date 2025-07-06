module.exports = {
    // Basic bot configuration
    token: process.env.DISCORD_TOKEN || '',
    prefix: '!',
    owners: ['123456789012345678'],
    
    // Database configuration
    database: {
        mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/discord-bot',
        redisURI: process.env.REDIS_URI || 'redis://localhost:6379'
    },
    
    // Feature toggles
    features: {
        economy: true,
        moderation: true,
        leveling: true,
        music: false,
        tickets: true,
        reactionRoles: true,
        starboard: true,
        automod: true,
        giveaways: true
    },
    
    // Feature-specific configurations
    economy: {
        dailyAmount: 100,
        workMin: 50,
        workMax: 200
    },
    
    leveling: {
        xpPerMessage: 15,
        xpCooldown: 60000,
        levelMultiplier: 100
    },
    
    moderation: {
        muteRole: 'Muted',
        modLogChannel: 'mod-logs'
    },
    
    // Web dashboard
    dashboard: {
        enabled: true,
        port: 3000,
        secret: process.env.DASHBOARD_SECRET,
        baseURL: 'http://localhost:3000'
    },
    
    // Other settings
    colors: {
        default: '#5865F2',
        error: '#ED4245',
        success: '#57F287',
        warning: '#FEE75C'
    },
    
    logging: {
        level: 'debug',
        file: 'bot.log'
    }
};