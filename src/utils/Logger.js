const { createWriteStream } = require('fs');
const { format } = require('util');

const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

class Logger {
    constructor(level = 'info', logFile = null) {
        this.level = logLevels[level] || logLevels.info;
        this.stream = logFile ? createWriteStream(logFile, { flags: 'a' }) : null;
    }
    
    log(level, message, ...args) {
        if (logLevels[level] > this.level) return;
        
        const timestamp = new Date().toISOString();
        const formatted = `[${timestamp}] [${level.toUpperCase()}] ${format(message, ...args)}`;
        
        console[level](formatted);
        if (this.stream) this.stream.write(formatted + '\n');
    }
    
    error(message, ...args) {
        this.log('error', message, ...args);
    }
    
    warn(message, ...args) {
        this.log('warn', message, ...args);
    }
    
    info(message, ...args) {
        this.log('info', message, ...args);
    }
    
    debug(message, ...args) {
        this.log('debug', message, ...args);
    }
}

module.exports = Logger;