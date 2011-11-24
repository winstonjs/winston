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

var maxfilesTransport = new winston.transports.File({
  timestamp: false,
  json: false,
  filename: path.join(__dirname, '..', 'fixtures', 'logs', 'testmaxfiles.log'),
  maxsize: 4096,
  maxFiles: 3
});
    
vows.describe('winston/transports/file/maxfiles').addBatch({
  "An instance of the File Transport": {
    "when passed a valid filename": {
      topic: maxfilesTransport,
      "should be a valid transporter": function (transportTest) {
        helpers.assertFile(transportTest);
      },
      "should set the maxFiles option correctly": function (transportTest) {
        assert.isNumber(transportTest.maxFiles);
      }
    },
    "when delete old test files": {
      topic: function () {
        exec('rm -rf ' + path.join(__dirname, '..', 'fixtures', 'logs', 'testmaxfiles*'), this.callback);
      },
      "and when passed more files than the maxFiles": {
        topic: function () {
          var that = this,
              data = function (ch) {
                return new Array(1018).join(String.fromCharCode(65 + ch));
              };
          
          function logKbytes (kbytes, txt) {
            //
            // With no timestamp and at the info level,
            // winston adds exactly 7 characters: 
            // [info](4)[ :](2)[\n](1)
            //
            for (var i = 0; i < kbytes; i++) {
              maxfilesTransport.log('info', data(txt), null, function () { });
            }
          }
          
          var j = 0;
          
          maxfilesTransport.on('logged', function () {
            j++;
            if (j === 6)
              return that.callback();
            else
              logKbytes(4, j);
          });
         
          logKbytes(4, j);
        },
        "should be only 3 files called 5.log, 4.log and 3.log": function () {
          for (var o = 0; o < 6; o++) {
            var file = path.join(__dirname, '..', 'fixtures', 'logs', ((o === 0) ? 'testmaxfiles.log' : 'testmaxfiles' + o + '.log'));
            // There should be no files with that name
            if (o >= 0 && o < 3) {
              assert.throws(function () {
                fs.statSync(file);
              }, Error);
            } else {
              // The other files should be exist
              assert.doesNotThrow(function () {
                fs.statSync(file);
              }, Error);
            }
          }
        },
        "should have the correct content": function () {
          ['D', 'E', 'F'].forEach(function (name, inx) {
            var counter = inx + 3,
                content = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'logs', 'testmaxfiles' + counter + '.log'), 'utf-8');
            // The content minus the 7 characters added by winston
            assert.lengthOf(content.match(new RegExp(name, 'g')), 4068);
          });
        }
      }
    }
  }
}).export(module);