/*
 * colorize.js: A test fixture for logging colorized messages
 *
 * (C) 2015 Tom Spencer
 * MIT LICENCE
 *
 */

var winston = require('../../../lib/winston');

var formats = {
  colorize: winston.format.colorize(),
  simple: winston.format.simple()
};

var format = winston.format(
  formats.colorize,
  formats.simple
);

format.on('readable', function () {
  console.log('wtf pumpified');
});

Object.keys(formats).forEach(function (key) {
  formats[key].on('readable', function () {
    console.log('wtf %s', key);
  });
});

var logger = new (winston.Logger)({
  format: format,
  transports: [
    new winston.transports.Console()
  ]
});

logger.info('Simply a test');
