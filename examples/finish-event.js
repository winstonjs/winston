'use strict';

const winston = require('../');

//
// In winston@3.x both the Logger and the Transport are Node.js streams.
// Node.js streams expose a `.end()` method that signals no more data will\
// be written. The `"finish"` event is emitted after `.end()` has been called
// **AND** all data has been flushed (i.e. all your logs have been written).
//
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console()
  ]
});

process.on('exit', function () {
  console.log('Your process is exiting');
});

logger.on('finish', function () {
  console.log('Your logger is done logging');
});

logger.log('info', 'Hello, this is a raw logging event',   { 'foo': 'bar' });
logger.log('info', 'Hello, this is a raw logging event 2', { 'foo': 'bar' });

logger.end();
