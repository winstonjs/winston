'use strict';

const winston = require('../');

const defaultLevels = winston.createLogger({
  level: 'silly',
  format: winston.format.simple(),
  transports: new winston.transports.Console()
});

function logAllLevels() {
  Object.keys(winston.config.npm.levels).forEach(level => {
    defaultLevels[level](`is logged when logger.level="${defaultLevels.level}"`);
  });
}

logAllLevels();

//
// TODO: THIS IS BROKEN & MUST BE FIXED BEFORE 3.0
// Logger.prototype.level must be a setter to set the
// default level on all Transports.
//
defaultLevels.level = 'error';
logAllLevels();
