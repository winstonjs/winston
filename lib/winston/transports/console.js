/*
 * console.js: Transport for outputting to the console
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var events = require('events'),
    util = require('util'),
    colors = require('colors'),
    log = require('../internal').log;

//
// ### function Console (options)
// #### @options {Object} Options for this instance.
// Constructor function for the Console transport object responsible
// for persisting log messages and metadata to a terminal or TTY.
//
var Console = exports.Console = function (options) {
  events.EventEmitter.call(this);
  options = options || {};
  
  this.name      = 'console';
  this.level     = options.level    || 'info';
  this.silent    = options.silent   || false;
  this.colorize  = options.colorize || false;
  this.timestamp = typeof options.timestamp !== 'undefined' ? options.timestamp : false;
};

//
// Inherit from `events.EventEmitter`.
//
util.inherits(Console, events.EventEmitter);

//
// Expose the name of this Transport on the prototype
//
Console.prototype.name = 'console';

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
Console.prototype.log = function (level, msg, meta, callback) {
  if (this.silent) {
    return callback(null, true);
  }
    
  var output = log(level, msg, meta, {
    colorize: this.colorize, 
    timestamp: this.timestamp
  });
  
  if (level === 'error' || level === 'debug') {
    util.error(output);
  }
  else {
    util.puts(output);
  }
  
  callback(null, true);
};