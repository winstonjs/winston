/*
 * loggly.js: Transport for logginh to remote Loggly API
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var events = require('events'),
    loggly = require('loggly'),
    util = require('util'),
    internal = require('../internal'); 

//
// ### function Loggly (options)
// #### @options {Object} Options for this instance.
// Constructor function for the Loggly transport object responsible
// for persisting log messages and metadata to Loggly; 'LaaS'.
//
var Loggly = exports.Loggly = function (options) {
  events.EventEmitter.call(this);
  options = options || {};
  
  if (!options.subdomain) {
    throw new Error('Loggly Subdomain is required');
  }
  
  if (!options.inputToken && !options.inputName) {
    throw new Error('Target input token or name is required.');
  }
  
  if (!options.auth && options.inputName) {
    throw new Error('Loggly authentication is required');
  }
  
  this.name = 'loggly'; 
  this.level = options.level || 'info';
  this.logBuffer = [];
  
  this.client = loggly.createClient({
    subdomain: options.subdomain,
    auth: options.auth || null
  });
  
  if (options.inputToken) {
    this.inputToken = options.inputToken;
    this.ready = true;
  }
  else if (options.inputName) {
    this.ready = false;
    this.inputName = options.inputName;
    
    var self = this;
    this.client.getInput(this.inputName, function (err, input) {
      if (err) {
        throw err;
      }
      
      self.inputToken = input.input_token;
      self.ready = true;
    });
  }
};

//
// Inherit from `events.EventEmitter`.
//
util.inherits(Loggly, events.EventEmitter);

//
// Expose the name of this Transport on the prototype
//
Loggly.prototype.name = 'loggly';

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
Loggly.prototype.log = function (level, msg, meta, callback) {
  if (this.silent) {
    return callback(null, true);
  }

  var message = internal.clone(meta);
  message.level = level;
  message.message = msg;
  
  if (!this.ready) {
    //
    // If we haven't gotten the input token yet
    // add this message to the log buffer.
    //
    this.logBuffer.push(message);
  }
  else if (this.ready && this.logBuffer.length > 0) {
    //
    // Otherwise if we have buffered messages
    // add this message to the buffer and flush them.
    //
    this.logBuffer.push(message);
    this.flush();
  }
  else {
    //
    // Otherwise just log the message as normal
    //
    this.client.log(this.inputToken, message);
  }
  
  callback(null, true);
};

//
// ### function flush ()
// Flushes any buffered messages to the current `stream`
// used by this instance.
//
Loggly.prototype.flush = function () {
  var self = this, 
      length = this.logBuffer.length;
  
  // Close over each message
  this.logBuffer.forEach(function (msg) {
    self.client.log(self.inputToken, msg, function (err) {
      if (err) {
        self.emit('error', err);
      }
    });
  });
  
  // Then quickly truncate the list
  this.logBuffer.length = 0;
};