/*
 * loggly.js: Transport for logginh to remote Loggly API
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var loggly = require('loggly'),
    utils = require('./../utils'); 

//
// function Loggly (options)
//   Constructor for the Loggly transport object.
//
var Loggly = exports.Loggly = function (options) {
  options = options || {};
  if (!options.subdomain)  throw new Error('Loggly Subdomain is required');
  if (!options.inputToken && !options.inputName) throw new Error('Target input token or name is required.');
  if (!options.auth && options.inputName)        throw new Error('Loggly authentication is required');
  
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
      if (err) throw err;
      
      self.inputToken = input.input_token;
      self.ready = true;
    });
  }
};

//
// function log (level, msg, [meta], callback)
//   Core logging method exposed to Winston. Metadata is optional.
//
Loggly.prototype.log = function (level, msg, meta, callback) {
  var message = utils.clone(meta);
  message.level = level;
  message.message = msg;
  
  // If we haven't gotten the input token yet
  // add this message to the log buffer.
  if (!this.ready) {
    this.logBuffer.push(message);
    return callback(null, true);
  }
  
  // Otherwise if we have buffered messages
  // add this message to the buffer and flush them.
  if (this.ready && this.logBuffer.length > 0) {
    this.logBuffer.push(message);
    return this.flush(callback);
  }
  
  // Otherwise just log the message as normal
  this.client.log(this.inputToken, message, callback);
};

Loggly.prototype.flush = function (callback) {
  var self = this, flushed = 0,
      length = this.logBuffer.length;
  
  // Close over each message
  this.logBuffer.forEach(function (msg) {
    process.nextTick(function () {
      this.client.log(self.inputToken, msg, function () {
        if (flushed++ === count) return callback(null, true);
      });
    });
  });
  
  // Then quickly truncate the list (thanks isaacs)
  this.logBuffer.length = 0;
};