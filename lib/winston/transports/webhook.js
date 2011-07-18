/*
 * webhook.js: Transport for logging to remote http endpoints ( POST / RECEIVE webhooks )
 *
 * (C) 2011 Marak Squires
 * MIT LICENCE
 *
 */

var events = require('events'),
    http = require('http'),
    util = require('util'),
    internal = require('../internal'); 

//
// ### function WebHook (options)
// #### @options {Object} Options for this instance.
// Constructor function for the Console transport object responsible
// for making arbitrary HTTP requests whenever log messages and metadata
// are received.
//
var Webhook = exports.Webhook = function (options) {
  events.EventEmitter.call(this);
  options = options || {};

  this.name   = 'webhook'; 
  this.level  = options.level  || 'info';
  this.host   = options.host   || 'localhost';
  this.port   = options.port   || 8080;
  this.method = options.method || 'POST';
  this.path   = options.path   || '/winston-log';

  if (options.auth) {
    //
    // TODO: add http basic auth options for outgoing HTTP requests
    //     
  }
  
  if (options.ssl) {
    //
    //  TODO: add ssl support for outgoing HTTP requests
    //
  }  
};

//
// Inherit from `events.EventEmitter`.
//
util.inherits(Webhook, events.EventEmitter);

//
// Expose the name of this Transport on the prototype
//
Webhook.prototype.name = 'webhook';

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
Webhook.prototype.log = function (level, msg, meta, callback) {
  if (this.silent) {
    return callback(null, true);
  }
  
  var self = this,
      message = internal.clone(meta),
      options,
      req;
      
  message.level = level;
  message.message = msg;

  // Prepare options for outgoing HTTP request
  options = {
    host: this.host,
    port: this.port,
    path: this.path,
    method: this.method
  };
  
  // Perform HTTP logging request
  req = http.request(options, function (res) { 
    //
    // No callback on request, fire and forget about the response
    //
  }); 

  req.on('error', function (err) {
    //
    // Propagate the `error` back up to the `Logger` that this
    // instance belongs to.
    //
    self.emit('error', err);
  });
  
  //
  // Write logging event to the outgoing request body
  //
  // jsonMessage is currently conforming to JSON-RPC v1.0, 
  // but without the unique id since there is no anticipated response 
  // see: http://en.wikipedia.org/wiki/JSON-RPC
  // 
  req.write(JSON.stringify({ 
    method: 'log', 
    params: { 
      timestamp: internal.timestamp(), 
      msg: msg, 
      level: level, 
      meta: meta 
    } 
  }));
  
  req.end();
  
  // Always return true, regardless of any errors
  callback(null, true);
};
