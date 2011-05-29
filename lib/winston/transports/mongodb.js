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
  
  if (!options.db) { 
    throw new Error("Cannot log to MongoDB without database name.");
  }
  
  this.name = 'mongodb';
  this.db = options.db;
  this.host = options.host || 'localhost';
  this.port = options.port || mongodb.Connection.DEFAULT_PORT;
  this.collection = options.collection || "log";
  this.safe = options.safe || true;
  this.level = options.level || 'info';
  this.silent = options.silent || false;
};

//
// function log (level, msg, [meta], callback)
//   Core logging method exposed to Winston. Metadata is optional.
//
MongoDB.prototype.log = function (level, msg, meta, callback) {
  var self = this;
  
  if (this.silent) {
    return callback(null, true);
  }
  
  var client = new mongodb.Db(this.db, new mongodb.Server(this.host, this.port, {}), { 
    native_parser : false
  });
    
  client.open(function (err, db) {
    if (err) {
      return callback(err, false);
    }
    
    db.collection(self.collection, function (err, col) {
      if (err) {
        return callback(err, false);
      }

      var entry = { 
        level: level, 
        message: msg, 
        meta: meta
      };
      
      col.save(entry, { safe: self.safe }, function (err, doc) {
        if (err) {
          return callback(err, false);
        }

        db.close();
        callback(null, true);
      });
    });
  });
};