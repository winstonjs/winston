/*
 * file-test.js: Tests for instances of the File transport
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var assert = require('assert'),
    exec = require('child_process').exec,
    fs = require('fs'),
    path = require('path'),
    vows = require('vows'),
    winston = require('../lib/winston'),
    helpers = require('./helpers');

var maxsizeTransport = new winston.transports.File({
  timestamp: false,
  filename: path.join(__dirname, 'fixtures', 'testmaxsize.log'),
  maxsize: 4096
});
    
vows.describe('winston/transports/file/maxsize').addBatch({
  "An instance of the File Transport": {
    "when passed a valid filename": {
      "the log() method": {
        topic: function () {
          exec('rm -rf ' + path.join(__dirname, 'fixtures', 'testmaxsize*'), this.callback);
        },
        "when passed more than the maxsize": {
          topic: function () {
            var that = this,
                data = new Array(1018).join('-');
            
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
                maxsizeTransport.log('info', data, null, function () { });
              }
            }
            
            maxsizeTransport.on('open', function (file) {
              var match = file.match(/(\d+)\.log$/),
                  count = match ? match[1] : 0;
              
              that.files.push(file);
              
              if (parseInt(count, 10) == 5) {
                return that.callback();
              }
              
              logKbytes(4);
            });
            
            logKbytes(4);
          },
          "should create multiple files correctly": function () {
            this.files.forEach(function (file) {
              try {
                var stats = fs.statSync(file);
                assert.equal(stats.size, 4096);
              }
              catch (ex) {
                assert.isNull(ex);
              }
            });
          }
        }
      }
    }
  }
}).export(module);