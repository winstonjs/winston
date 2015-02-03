
var fs = require('fs'),
    path = require('path'),
    winston = require('../lib/winston');

var filename = path.join(__dirname, 'created-logfile.log');

//
// Remove the file, ignoring any errors
//
try { fs.unlinkSync(filename); }
catch (ex) { }

//
// Create a new winston logger instance with two tranports: Console, and File
//
//
var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({ filename: filename })
  ]
});

logger.log('info', 'Hello created log files!', { 'foo': 'bar' });

setTimeout(function () {
  //
  // Remove the file, ignoring any errors
  //
  try { fs.unlinkSync(filename); }
  catch (ex) { }
}, 1000);
