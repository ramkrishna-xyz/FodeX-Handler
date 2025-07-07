const { PermissionsBitField } = require('discord.js');
const Logger = require('./Logger');
const config = require('../config');

module.exports = class PermissionManager {
    constructor(client) {
        this.client = client;
        this.logger = new Logger(config.logging.level, config.logging.file);
        this.cache = new Map();
        this.defaultPermissions = {
            // Core permissions
            administrator: false,
            manageGuild: false,
            
            // Feature permissions
            moderation: {
                kickMembers: false,
                banMembers: false,
                muteMembers: false,
                warnMembers: false
            },
            economy: {
                manageShop: false,
                manageJobs: false
            },
            tickets: {
                create: true,
                manage: false
            }
        };
    }

    async initialize() {
        // Load permissions from database if needed
        this.logger.debug('PermissionManager initialized');
    }

    /**
     * Check if a member has permission to execute a command
     * @param {GuildMember} member - The member to check
     * @param {string} permission - The permission node to check
     * @param {Object} [options] - Additional options
     * @param {GuildChannel} [options.channel] - Channel context
     * @param {boolean} [options.bypassOwner] - Bypass for bot owners
     * @returns {Promise<boolean>}
     */
    async hasPermission(member, permission, options = {}) {
        // Bypass for bot owners
        if (options.bypassOwner && config.owners.includes(member.id)) {
            return true;
        }

        // Check Discord base permissions first
        if (this.checkDiscordPermissions(member, permission, options.channel)) {
            return true;
        }

        // Check custom permissions
        const customPerms = await this.getCustomPermissions(member.guild.id, member.id);
        return this.checkPermissionNode(customPerms, permission);
    }

    /**
     * Check Discord base permissions
     * @private
     */
    checkDiscordPermissions(member, permission, channel) {
        const channelPerms = channel ? member.permissionsIn(channel) : member.permissions;
        
        // Handle admin bypass
        if (channelPerms.has(PermissionsBitField.Flags.Administrator)) {
            return true;
        }

        // Map our permission nodes to Discord permissions
        const discordPermissions = this.mapToDiscordPermissions(permission);
        return discordPermissions.some(perm => channelPerms.has(perm));
    }

    /**
     * Map our permission nodes to Discord permissions
     * @private
     */
    mapToDiscordPermissions(permission) {
        const mapping = {
            // Moderation
            'moderation.kickMembers': [PermissionsBitField.Flags.KickMembers],
            'moderation.banMembers': [PermissionsBitField.Flags.BanMembers],
            'moderation.muteMembers': [PermissionsBitField.Flags.ModerateMembers],
            'moderation.warnMembers': [PermissionsBitField.Flags.ModerateMembers],
            
            // Economy
            'economy.manageShop': [PermissionsBitField.Flags.ManageGuild],
            'economy.manageJobs': [PermissionsBitField.Flags.ManageGuild],
            
            // Tickets
            'tickets.manage': [PermissionsBitField.Flags.ManageChannels]
        };

        return mapping[permission] || [];
    }

    /**
     * Get custom permissions for a user
     * @private
     */
    async getCustomPermissions(guildId, userId) {
        const cacheKey = `perms:${guildId}:${userId}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Get from database
        try {
            const guildData = await this.client.models.Guild.get(guildId);
            const userData = await this.client.models.User.get(userId);
            
            // Merge permissions
            const permissions = {
                ...this.defaultPermissions,
                ...guildData.permissions?.default,
                ...userData.permissions
            };

            // Apply role permissions
            if (userData.roles && guildData.permissions?.roles) {
                for (const roleId of userData.roles) {
                    if (guildData.permissions.roles[roleId]) {
                        this.mergePermissions(permissions, guildData.permissions.roles[roleId]);
                    }
                }
            }

            // Cache for 5 minutes
            this.cache.set(cacheKey, permissions);
            setTimeout(() => this.cache.delete(cacheKey), 300000);

            return permissions;
        } catch (error) {
            this.logger.error('Error getting custom permissions:', error);
            return this.defaultPermissions;
        }
    }

    /**
     * Merge permission objects
     * @private
     */
    mergePermissions(base, additional) {
        for (const key in additional) {
            if (typeof additional[key] === 'object' && additional[key] !== null && !Array.isArray(additional[key])) {
                if (!base[key]) base[key] = {};
                this.mergePermissions(base[key], additional[key]);
            } else {
                base[key] = additional[key];
            }
        }
    }

    /**
     * Check a permission node
     * @private
     */
    checkPermissionNode(permissions, node) {
        const parts = node.split('.');
        let current = permissions;

        for (const part of parts) {
            if (current[part] === undefined) {
                return false;
            }
            
            if (typeof current[part] === 'object') {
                current = current[part];
            } else {
                return !!current[part];
            }
        }

        return false;
    }

    /**
     * Set permissions for a role
     */
    async setRolePermissions(guildId, roleId, permissions) {
        try {
            await this.client.models.Guild.update(guildId, {
                [`permissions.roles.${roleId}`]: permissions
            });

            // Clear relevant cache
            this.clearGuildCache(guildId);
            return true;
        } catch (error) {
            this.logger.error('Error setting role permissions:', error);
            return false;
        }
    }

    /**
     * Set default permissions for a guild
     */
    async setDefaultPermissions(guildId, permissions) {
        try {
            await this.client.models.Guild.update(guildId, {
                'permissions.default': permissions
            });

            this.clearGuildCache(guildId);
            return true;
        } catch (error) {
            this.logger.error('Error setting default permissions:', error);
            return false;
        }
    }

    /**
     * Set permissions for a user
     */
    async setUserPermissions(guildId, userId, permissions) {
        try {
            await this.client.models.User.update(userId, {
                permissions
            });

            this.cache.delete(`perms:${guildId}:${userId}`);
            return true;
        } catch (error) {
            this.logger.error('Error setting user permissions:', error);
            return false;
        }
    }

    /**
     * Clear cache for a guild
     * @private
     */
    clearGuildCache(guildId) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(`perms:${guildId}:`)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Get all permissions for a member (for display purposes)
     */
    async getAllPermissions(member) {
        const discordPerms = member.permissions.toArray();
        const customPerms = await this.getCustomPermissions(member.guild.id, member.id);
        
        return {
            discord: discordPerms,
            custom: customPerms
        };
    }

    /**
     * Check if a command can be run in a channel
     */
    async checkChannelPermissions(command, channel) {
        if (!command.channelPermissions) return true;
        
        const guildData = await this.client.models.Guild.get(channel.guild.id);
        const channelOverrides = guildData?.permissions?.channels?.[channel.id]?.commands || {};
        
        if (channelOverrides[command.name] === false) {
            return false;
        }
        
        if (channelOverrides[command.category] === false) {
            return !command.ignoreCategoryOverrides;
        }
        
        return true;
    }
};