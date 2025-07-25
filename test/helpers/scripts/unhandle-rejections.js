/*
 * unhandle-rejections.js: A test fixture for using `.unhandleRejections()` winston.
 *
 * (C) 2011 Charlie Robbins
 * MIT LICENCE
 *
 */

var path = require('path');
var winston = require('../../../lib/winston');
const testLogFixturesPath = path.join(__dirname, '..', '..', 'fixtures', 'logs');

var logger = winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: path.join(testLogFixturesPath, 'unhandle-rejections.log')
    })
  ]
});

logger.transports[0].transport.handleRejections;

logger.rejections.handle();
logger.rejections.unhandle();

setTimeout(function () {
  Promise.reject(new Error('OH NOES! It rejected!'));
}, 200);
