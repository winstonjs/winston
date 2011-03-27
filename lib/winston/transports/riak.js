/*
 * riak.js: Transport for logging to Riak server
 *          (Special thanks to node-rlog)
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */
 
//var riakjs = require('riak-js'),
//    utils = require('./../utils');
//
//
// function Riak (options)
//   Constructor for the Riak transport object.
//
//var Riak = exports.Riak = function (options) {
//  options = options || {};
//  options.debug = options.debug || false;
//  
//  this.client = riakjs.getClient(options);
//  
//  this.name = 'riak';
//  this.level = options.level || 'info';
//  this.bucket = options.bucket || Date.now();
//  this.generate = typeof this.bucket === 'function';
//};
//
//
// function log (level, msg, [meta], callback)
//   Core logging method exposed to Winston. Metadata is optional.
//
//Riak.prototype.log = function (level, msg, meta, callback) {
//  var bucketName = this.bucket, metac = utils.clone(meta);
//  
//  // Deep clone the object for adding to Riak
//  metac.level = level;
//  metac.contentType = msg instanceof Object ? 'application/json' : 'text/plain';
//  
//  if (this.generate) {
//    var nextBucket = this.bucket(level, msg, meta, Date.now());
//    if (this.lastBucket !== nextBucket) this.lastBucket = nextBucket;
//    bucketName = this.lastBucket;
//  }
//  
//  this.client.save(bucketName, Date.now(), msg, metac, callback);
//};