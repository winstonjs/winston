/*
 * file-maxfiles-test.js: Tests for instances of the File transport setting the max file size,
 * and setting a number for max files created.
 * maxSize * maxFiles = total storage used by winston.
 *
 * (C) 2011 Daniel Aristizabal
 * MIT LICENSE
 *
 */

var assert = require('assert'),
    exec = require('child_process').exec,
    fs = require('fs'),
    path = require('path'),
    vows = require('vows'),
    winston = require('../../lib/winston'),
    helpers = require('../helpers');

var maxsizeTransport = new winston.transports.File({
  timestamp: false,
  json: false,
  filename: path.join(__dirname, '..', 'fixtures', 'logs', 'testmaxfiles.log'),
  maxsize: 4096,
  maxFiles: 3
});
    
vows.describe('winston/transports/file/maxfiles').addBatch({
  "An instance of the File Transport": {
    "when passed a valid filename": {
      "the log() method": {
        topic: function () {
          exec('rm -rf ' + path.join(__dirname, '..', 'fixtures', 'logs', 'testmaxfiles*'), this.callback);
        },
        "when passed more files than the maxFiles": {
          topic: function () {
            var that = this,
                data = function (ch) {
                  return new Array(1018).join(String.fromCharCode(65 + ch));
                }; 
            
            //
            // Setup a list of files which we will later stat.
            //
            that.files = [];
            
            function logKbytes (kbytes) {
              //
              // With no timestamp and at the info level,
              // winston adds exactly 7 characters: 
              // [info](4)[ :](2)[\n](1)
              //
              for (var i = 0; i < kbytes; i++) {
                maxsizeTransport.log('info', data(that.files.length), null, function () { });
              }
            }
            
            maxsizeTransport.on('open', function (file) {
              var match = file.match(/(\d+)\.log$/),
                  count = match ? match[1] : 0;
              
              that.files.push(file);
              
              if (that.files.length === 5) {
                return that.callback();
              }
              
              logKbytes(4);
            });
            
            logKbytes(4);
          },
          "should delete old files correctly": function () {
            this.files.forEach(function (file) {
              try {
                var stats = fs.statSync(file);
                assert.equal(stats.size, 4096);
              }
              catch (ex) {
                assert.isNull(ex);
              }
            });
          },
          "should move logs to new names": function () {
            assert.isFalse(true);
          }
        }
      }
    }
  }
}).export(module);