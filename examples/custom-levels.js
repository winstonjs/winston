/*
 * custom-levels.js: Custom logger and color levels in winston
 *
 * (C) 2012, Nodejitsu Inc.
 *
 */

var winston = require('../lib/winston');

//
// Logging levels
//
var config = {
  levels: {
    error: 0,
    debug: 1,
    warn: 2,
    data: 3,
    info: 4,
    verbose: 5,
    silly: 6
  },
  colors: {
    error: 'red',
    debug: 'blue',
    warn: 'yellow',
    data: 'grey',
    info: 'green',
    verbose: 'cyan',
    silly: 'magenta'
  }
};

var logger = module.exports = winston.createLogger({
  transports: [
    new (winston.transports.Console)({
      colorize: true
    })
  ],
  levels: config.levels,
  colors: config.colors
});

logger.data('hello')
