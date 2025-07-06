const ExtendedClient = require('./structures/Client');

// Create new client instance
const client = new ExtendedClient();

// Start the bot
client.start();

// Handle process events
process.on('unhandledRejection', error => {
    client.logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    client.logger.error('Uncaught exception:', error);
});