/*
 * webhook.js: Transport for logging to remote http endpoints ( POST / RECEIVE webhooks )
 *
 * (C) 2011 Marak Squires
 * MIT LICENCE
 *
 */

var http = require('http'),
    utils = require('./../utils'); 

//
// function Webhook (options)
//   Constructor for the Webhook transport object.
//
var Webhook = exports.Webhook = function (options) {
  options = options || {};

  this.host = options.host || 'localhost';
  this.port = options.port || 8080;
  this.path = options.path || '/winston-log';

  //
  // TODO: add http basic auth options for outgoing HTTP requests
  // 
  if (options.auth) { }
  
  //
  //  TODO: add ssl support for outgoing HTTP requests
  //
  if (options.ssl) { }
  
  this.name = 'webhook'; 
  this.level = options.level || 'info';
};

//
// function log (level, msg, [meta], callback)
//   Core logging method exposed to Winston. Metadata is optional.
//
Webhook.prototype.log = function (level, msg, meta, callback) {

  var message = utils.clone(meta);
  message.level = level;
  message.message = msg;

  // Prepare options for outgoing HTTP request
  var options = {
    host: this.host,
    port: this.port,
    path: this.path,
    method: 'POST'
  };
  
  // Perform HTTP logging request
  var req = http.request(options, function (res) { 
    //
    // No callback on request, fire and forget about the response
    //
  }); 

  req.on('error', function (e) {
    //
    // TODO: Make transports instances of events.EventEmitter
    // and propagate this error back up only if the logger has 
    // `emitErrs` set.
    //
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
      timestamp: utils.timestamp(), 
      msg: msg, 
      level: level, 
      meta: meta 
    } 
  }));
  
  req.end();
  
  // Always return true, regardless of any errors
  callback(null, true);
};
