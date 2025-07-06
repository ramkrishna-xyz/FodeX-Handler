const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = class CustomEmbedBuilder {
    constructor() {
        this.embed = new EmbedBuilder();
        this.embed.setColor(config.colors.default);
    }
    
    setTitle(title) {
        this.embed.setTitle(title);
        return this;
    }
    
    setDescription(description) {
        this.embed.setDescription(description);
        return this;
    }
    
    setColor(color) {
        this.embed.setColor(color || config.colors.default);
        return this;
    }
    
    setAuthor(name, iconURL, url) {
        this.embed.setAuthor({ name, iconURL, url });
        return this;
    }
    
    setFooter(text, iconURL) {
        this.embed.setFooter({ text, iconURL });
        return this;
    }
    
    setTimestamp(timestamp = Date.now()) {
        this.embed.setTimestamp(timestamp);
        return this;
    }
    
    addField(name, value, inline = false) {
        this.embed.addFields({ name, value, inline });
        return this;
    }
    
    setImage(url) {
        this.embed.setImage(url);
        return this;
    }
    
    setThumbnail(url) {
        this.embed.setThumbnail(url);
        return this;
    }
    
    setURL(url) {
        this.embed.setURL(url);
        return this;
    }
    
    success() {
        this.embed.setColor(config.colors.success);
        return this;
    }
    
    error() {
        this.embed.setColor(config.colors.error);
        return this;
    }
    
    warning() {
        this.embed.setColor(config.colors.warning);
        return this;
    }
    
    build() {
        return this.embed;
    }
    
    static quick(title, description, color) {
        const embed = new CustomEmbedBuilder();
        if (title) embed.setTitle(title);
        if (description) embed.setDescription(description);
        if (color) embed.setColor(color);
        return embed.build();
    }
};