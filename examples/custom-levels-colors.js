'use strict';

const winston = require('../lib/winston');

//
// Logging levels
//
const config = {
  levels: {
    error: 0,
    debug: 1,
    warn: 2,
    data: 3,
    info: 4,
    verbose: 5,
    silly: 6,
    custom: 7
  },
  colors: {
    error: 'red',
    debug: 'blue',
    warn: 'yellow',
    data: 'grey',
    info: 'green',
    verbose: 'cyan',
    silly: 'magenta',
    custom: 'yellow'
  }
};

const customColorize = winston.format.colorize();
customColorize.addColors(config.colors);

const logger = module.exports = winston.createLogger({
  levels: config.levels,
  format: winston.format.combine(
    customColorize,
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console()
  ],
  level: 'custom'
});

logger.custom('hello')
