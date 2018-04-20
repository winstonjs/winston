'use strict';

const winston = require('../');

//
// TODO: THIS IS BROKEN & MUST BE FIXED BEFORE 3.0
// This should output what was previously referred to
// as "humanReadableUncaughtExceptions" by default.
//
const logger = winston.createLogger({
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console({ handleExceptions: true })
  ]
});

throw new Error('Hello, winston!');
