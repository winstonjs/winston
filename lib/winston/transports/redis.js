/*
 * Redis.js: Transport for logging to Redis
 *
 * (C) 2011 Peter Sunde
 * MIT LICENSE
 *
 */

var events = require('events'),
    util = require('util'),
    common = require('../common'),
    redis = require("redis"),
    Transport = require('./transport').Transport; 

//
// ### function Redis (options)
// #### @options {Object} Options for this instance.
// Constructor function for the Console transport object responsible
// for making arbitrary HTTP requests whenever log messages and metadata
// are received.
//
var Redis = exports.Redis = function (options) {
  Transport.call(this, options);

  this.name   = 'Redis'; 
  this.db     = options.db || 'winston-log';
  this.host   = options.host   || 'localhost';
  this.port   = options.port   || 6379;
  this.client = redis.createClient(options.port, options.host);

};

//
// Inherit from `winston.Transport`.
//
util.inherits(Redis, Transport);

//
// Expose the name of this Transport on the prototype
//
Redis.prototype.name = 'Redis';

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
Redis.prototype.log = function (level, msg, meta, callback) {
  if (this.silent) {
    return callback(null, true);
  }
  
  message = common.clone(meta);      
  message.level = level;
  message.message = msg;
   
  var self = this;
   
  this.client.on('error', function (err) {
    //
    // Propagate the `error` back up to the `Logger` that this
    // instance belongs to.
    //
    self.emit('error', err);
  });
  
  //
  // Write logging event to the redis datastore
  //
  this.client.lpush(this.db, JSON.stringify({ 
    method: 'log', 
    params: { 
      timestamp: new Date(), // RFC3339/ISO8601 format instead of common.timestamp()
      msg: msg, 
      level: level, 
      meta: meta 
    } 
  }), function result(err) {
      self.emit('logged', err);
      self.client.end(); 
  });
  
  // Always return true, regardless of any errors
  callback(null, true);
};