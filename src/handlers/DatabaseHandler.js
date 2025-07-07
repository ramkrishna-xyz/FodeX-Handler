const { MongoClient } = require('mongodb');
const { createClient } = require('redis');
const Logger = require('../utils/Logger');
const config = require('../config');

module.exports = class DatabaseHandler {
    constructor(client) {
        this.client = client;
        this.logger = new Logger(config.logging.level, config.logging.file);
        this.mongo = null;
        this.redis = null;
        this.models = {};
    }

    async connect() {
        try {
            await this.connectMongoDB();
            await this.connectRedis();
            await this.loadModels();
            this.logger.info('Database connections established');
        } catch (error) {
            this.logger.error('Failed to connect to databases:', error);
            throw error;
        }
    }

    async connectMongoDB() {
        try {
            const mongoClient = new MongoClient(config.database.mongoURI, {
                connectTimeoutMS: 10000,
                socketTimeoutMS: 30000,
                serverSelectionTimeoutMS: 10000,
                maxPoolSize: 50,
                retryWrites: true,
                retryReads: true
            });

            await mongoClient.connect();
            this.mongo = mongoClient.db();
            this.logger.info('Connected to MongoDB');
        } catch (error) {
            this.logger.error('MongoDB connection error:', error);
            throw error;
        }
    }

    async connectRedis() {
        if (!config.database.redisURI) {
            this.logger.warn('Redis URI not configured, skipping Redis connection');
            return;
        }

        try {
            this.redis = createClient({
                url: config.database.redisURI,
                socket: {
                    reconnectStrategy: (retries) => Math.min(retries * 100, 5000)
                }
            });

            this.redis.on('error', (err) => {
                this.logger.error('Redis error:', err);
            });

            this.redis.on('connect', () => {
                this.logger.debug('Redis connection established');
            });

            this.redis.on('reconnecting', () => {
                this.logger.warn('Redis reconnecting...');
            });

            await this.redis.connect();
            this.logger.info('Connected to Redis');
        } catch (error) {
            this.logger.error('Redis connection error:', error);
            throw error;
        }
    }

    async loadModels() {
        try {
            this.models = {
                // Core Models
                Guild: this.createGuildModel(),
                User: this.createUserModel(),

                // Feature Models
                Economy: this.createEconomyModel(),
                Level: this.createLevelModel(),
                Warn: this.createWarnModel(),
                Mute: this.createMuteModel(),
                Ticket: this.createTicketModel(),
                Giveaway: this.createGiveawayModel(),
                Reminder: this.createReminderModel(),
                Playlist: this.createPlaylistModel()
            };

            this.client.db = this.mongo;
            this.client.redis = this.redis;
            this.client.models = this.models;

            this.logger.info('Database models loaded');
        } catch (error) {
            this.logger.error('Failed to load database models:', error);
            throw error;
        }
    }

    // Model Definitions
    createGuildModel() {
        return {
            get: async (guildId) => {
                const cacheKey = `guild:${guildId}`;
                
                // Try Redis cache first
                if (this.redis) {
                    const cached = await this.redis.get(cacheKey);
                    if (cached) return JSON.parse(cached);
                }

                // Fallback to MongoDB
                const guild = await this.mongo.collection('guilds').findOne({ guildId }) || 
                    await this.createDefaultGuild(guildId);

                // Cache in Redis
                if (this.redis) {
                    await this.redis.setEx(cacheKey, 3600, JSON.stringify(guild)); // 1 hour cache
                }

                return guild;
            },

            update: async (guildId, data) => {
                const cacheKey = `guild:${guildId}`;
                const result = await this.mongo.collection('guilds').updateOne(
                    { guildId },
                    { $set: data },
                    { upsert: true }
                );

                // Invalidate cache
                if (this.redis) {
                    await this.redis.del(cacheKey);
                }

                return result;
            },

            createDefaultGuild: async (guildId) => {
                const defaultGuild = {
                    guildId,
                    prefix: config.prefix,
                    language: 'en',
                    modules: {
                        moderation: true,
                        economy: true,
                        leveling: true,
                        music: false
                    },
                    settings: {},
                    createdAt: new Date()
                };

                await this.mongo.collection('guilds').insertOne(defaultGuild);
                return defaultGuild;
            }
        };
    }

    createUserModel() {
        return {
            get: async (userId) => {
                const cacheKey = `user:${userId}`;
                
                if (this.redis) {
                    const cached = await this.redis.get(cacheKey);
                    if (cached) return JSON.parse(cached);
                }

                const user = await this.mongo.collection('users').findOne({ userId }) || 
                    await this.createDefaultUser(userId);

                if (this.redis) {
                    await this.redis.setEx(cacheKey, 1800, JSON.stringify(user)); // 30 min cache
                }

                return user;
            },

            update: async (userId, data) => {
                const cacheKey = `user:${userId}`;
                const result = await this.mongo.collection('users').updateOne(
                    { userId },
                    { $set: data },
                    { upsert: true }
                );

                if (this.redis) {
                    await this.redis.del(cacheKey);
                }

                return result;
            },

            createDefaultUser: async (userId) => {
                const defaultUser = {
                    userId,
                    flags: [],
                    settings: {},
                    createdAt: new Date()
                };

                await this.mongo.collection('users').insertOne(defaultUser);
                return defaultUser;
            }
        };
    }

    createEconomyModel() {
        return {
            getProfile: async (userId, guildId) => {
                const cacheKey = `economy:${guildId}:${userId}`;
                
                if (this.redis) {
                    const cached = await this.redis.get(cacheKey);
                    if (cached) return JSON.parse(cached);
                }

                const profile = await this.mongo.collection('economy').findOne({ userId, guildId }) || 
                    await this.createDefaultEconomyProfile(userId, guildId);

                if (this.redis) {
                    await this.redis.setEx(cacheKey, 900, JSON.stringify(profile)); // 15 min cache
                }

                return profile;
            },

            updateBalance: async (userId, guildId, amount) => {
                const cacheKey = `economy:${guildId}:${userId}`;
                const result = await this.mongo.collection('economy').updateOne(
                    { userId, guildId },
                    { $inc: { balance: amount } },
                    { upsert: true }
                );

                if (this.redis) {
                    await this.redis.del(cacheKey);
                }

                return result;
            },

            createDefaultEconomyProfile: async (userId, guildId) => {
                const defaultProfile = {
                    userId,
                    guildId,
                    balance: config.economy?.startingBalance || 100,
                    bank: 0,
                    inventory: [],
                    cooldowns: {},
                    stats: {
                        dailyStreak: 0,
                        totalEarned: 0
                    },
                    createdAt: new Date()
                };

                await this.mongo.collection('economy').insertOne(defaultProfile);
                return defaultProfile;
            }
        };
    }

    // Additional model definitions would follow the same pattern
    createLevelModel() { /* ... */ }
    createWarnModel() { /* ... */ }
    createMuteModel() { /* ... */ }
    createTicketModel() { /* ... */ }
    createGiveawayModel() { /* ... */ }
    createReminderModel() { /* ... */ }
    createPlaylistModel() { /* ... */ }

    // Utility Methods
    async cacheGet(key) {
        if (!this.redis) return null;
        try {
            const value = await this.redis.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            this.logger.error('Redis get error:', error);
            return null;
        }
    }

    async cacheSet(key, value, ttl = 3600) {
        if (!this.redis) return false;
        try {
            await this.redis.setEx(key, ttl, JSON.stringify(value));
            return true;
        } catch (error) {
            this.logger.error('Redis set error:', error);
            return false;
        }
    }

    async cacheDel(key) {
        if (!this.redis) return false;
        try {
            await this.redis.del(key);
            return true;
        } catch (error) {
            this.logger.error('Redis del error:', error);
            return false;
        }
    }

    async close() {
        try {
            if (this.mongo) {
                await this.mongo.client.close();
                this.logger.info('MongoDB connection closed');
            }
            if (this.redis) {
                await this.redis.quit();
                this.logger.info('Redis connection closed');
            }
        } catch (error) {
            this.logger.error('Error closing database connections:', error);
        }
    }
};