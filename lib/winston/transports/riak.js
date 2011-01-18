/*
 * riak.js: Transport for logging to Riak server
 *          (Special thanks to node-rlog)
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */
 
var riakjs = require('riak-js'),
    utils = require('./../utils');

//
// function Riak (options)
//   Constructor for the Riak transport object.
//
var Riak = exports.Riak = function (options) {
  options = options || {};
  options.debug = options.debug || false;
  
  this.client = riakjs.getClient(options);
  
  // TODO: Better support for dynamic bucket names
  this.name = 'riak';
  this.level = options.level || 'info';
  this.bucketName = options.bucketName || Date.now();
};

//
// function log (level, msg, [meta], callback)
//   Core logging method exposed to Winston. Metadata is optional.
//
Riak.prototype.log = function (level, msg, meta, callback) {
  var metac = utils.clone(meta);
  metac.level = level;
  metac.contentType = msg instanceof Object ? 'application/json' : 'text/plain';
  
  this.client.save(this.bucketName, Date.now(), msg, metac, callback);
};