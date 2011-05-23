/*
 * mongodb.js: Transport for outputting to a MongoDB database
 *
 * (C) 2010 Kendrick Taylor
 * MIT LICENCE
 *
 */

var util = require('util'),
    mongodb = require('mongodb'),
    colors = require('colors'),
    log = require('./../utils').log;
    
//
// function MongoDB (options)
//   Constructor for the MongoDB transport object.
//
var MongoDB = exports.MongoDB = function (options) {
  options = options || {}
  
  if(!options.db){ throw(new Error("Cannot log to MongoDB without database name."));}
  
  this.name = 'mongodb';
  this.db = options.db;
  this.host = options.host || 'localhost';
  this.port = options.port || mongodb.Connection.DEFAULT_PORT;
  this.collection = options.collection || "log";
  this.level = options.level || 'info';
  this.silent = options.silent || false;
  this.colorize = options.colorize || false;
  this.timestamp = options.timestamp || true;
};

//
// function log (level, msg, [meta], callback)
//   Core logging method exposed to Winston. Metadata is optional.
//
MongoDB.prototype.log = function (level, msg, meta, callback) {

  var that = this;
  
  if (!this.silent) {

    var entry = { 'level' : level, 'message' :  msg, 'meta' : meta};
    
    var client = new mongodb.Db(this.db, new mongodb.Server(this.host, this.port, {}), {native_parser : false});
    
    function handleError(err){ if(err){ throw(err); callback(err, false);} }
    
    client.open(function(err, db){
      handleError(err);

      db.collection(that.collection, function(err, col) {
        handleError(err);

        col.save(entry, {safe : true}, function(err, doc){
          handleError(err);

          db.close();

          callback(null, true);
          
        });
      });
    });
  
  }else{
    callback(null, true);
  }
  
};