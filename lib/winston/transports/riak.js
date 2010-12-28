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
 
var Riak = exports.Riak = function (options) {
  this.client = riakjs.getClient(options);
  
  // TODO: Better support for dynamic bucket names
  this.bucketName = options.bucketName;
};

Riak.prototype.log = function (level, msg, meta, callback) {
  var metac = utils.clone(meta);
  metac.level = level;
  metac.contentType = msg instanceof Object ? 'application/json' : 'text/plain';
  
  this.client.save(this.bucketName, Date.now, msg, metac, callback);
};