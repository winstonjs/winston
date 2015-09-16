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
    silly: 'magenta',
    verbose: 'cyan',
    info: 'green',
    data: 'grey',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
  }
};

var logger = module.exports = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      colorize: true
    })
  ],
  levels: config.levels,
  colors: config.colors
});

logger.data('hello')
