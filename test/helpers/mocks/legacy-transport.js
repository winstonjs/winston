'use strict'

var events = require('events'),
    util = require('util'),
    Transport = require('winston-compat').Transport;

//
// ### function Legacy (options)
// #### @options {Object} Options for this instance.
// Constructor function for the Legacy transport object responsible
// for persisting log messages and metadata to a memory array of messages
// and conforming to the old winston transport API.
//
var Legacy = module.exports = function (options) {
  options = options || {};
  Transport.call(this, options);

  this.silent = options.silent;
  this.output = { error: [], write: [] };
};

//
// Inherit from `winston.Transport`.
//
util.inherits(Legacy, Transport);

//
// Expose the name of this Transport on the prototype
//
Legacy.prototype.name = 'legacy-test';

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
Legacy.prototype.log = function (level, msg, meta, callback) {
  if (this.silent) {
    return callback(null, true);
  }

  var output = 'I AM BACKWARDS COMPATIBLE WITH LEGACY';

  if (level === 'error' || level === 'debug') {
    this.errorOutput.push(output);
  } else {
    this.writeOutput.push(output);
  }

  this.emit('logged');
  callback(null, true);
};
