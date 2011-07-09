/*
 * fileroller.js: Transport for outputting to a local log file with log rolling support
 *
 * (C) 2010 Arunoda Susiripala
 * MIT LICENCE
 *
 */

var util = require('util');
var fs = require('fs');
var path = require('path');
var log = require('./../utils').log;
    
/**
  File Log roller
  ----------------
  Rotate log files with a backup when the maximum log file size exceeded
  Options
    filename: path where logs needs to be stored
    maxsize : maximum size of the log file (default is 300 MB)
    interval: interval where checks for rotating logs (default is 1 min)
*/
exports.Fileroller = function (options) {

  var self = this;
  options = options || {};

  this.name = 'fileroller';
  this.filename = options.filename;
  this.interval = options.interval || 1000 * 60; // 1 min
  this.maxsize = options.maxsize || 1024 * 300; //300 MB
  this.level = options.level || 'info';
  this.silent = options.silent || false;
  this.colorize = options.colorize || false;
  this.timestamp = options.timestamp || true;

  //store logs temporly when logger goes offline for the maintainace
  var tmpLogs = [];

  if (options.filename) {
    this.stream = createStream(options.filename, options.options);
    startRolling(options.filename, options.maxsize);
  } else { 
    throw new Error('Cannot log to file without filename');
  }
  
  // 
  // Create a file stream file given filename and the options
  // 
  function createStream(filename, options) {
    return fs.createWriteStream(filename, options || { flags: 'a' });
  }

  function startRolling() {
    
    var options = {
      persistance: true,
      interval: self.interval
    };

    fs.watchFile(self.filename, function (curr, prev) {
      
      if(!self.offline && curr.size > self.maxsize) {
          self.offline = true;
          rollIt(self.filename, self.rollsize);
      }

    });
  }

  /*
    copy current log into the backup and start a new one
  */
  function rollIt(filepath, rollsize, callback) {

    var backupName = filepath + '_backup';
    
    //remove the current backup
    fs.unlink(backupName, unlinked);

    function unlinked() {
      //destroy the stream
      self.stream.destroy();
      //rename the curr log into a backup   
      fs.rename(filepath, backupName, renamed);  
    }

    function renamed(err) {
      
      if(err) {
        console.error('log rolling failed at backing up - err: ' + JSON.stringify(err));
      } else {

        //create the new stream
        self.stream = createStream(filepath, options);

        //make the logger online
        self.offline = false;

        //write tmp logs
        tmpLogs.forEach(function(output) {
          self.stream.write(output);
        });
        tmpLogs = [];
      }
    }
  }

  //
  // function log (level, msg, [meta], callback)
  //   Core logging method exposed to Winston. Metadata is optional.
  //
  this.log = function (level, msg, meta, callback) {
    if (!this.silent) {
      var output = log(level, msg, meta, {
        colorize: this.colorize,
        timestamp: this.timestamp
      });
      
      output += '\n';

      if(this.offline) {
        tmpLogs.push(output);
      } else {
        this.stream.write(output); 
      }
    }

    callback(null, true);
  };

};
