/*
 * exception-test.js: Tests for exception data gathering in winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    spawn = require('child_process').spawn,
    vows = require('vows'),
    winston = require('../lib/winston'),
    helpers = require('./helpers');

function tryUnlink (file) {
  try { fs.unlinkSync(file) }
  catch (ex) { }
}

vows.describe('winston/exception').addBatch({
  "When using winston": {
    "the handleException() method": {
      topic: function () {
        var that = this,
            child = spawn('node', [path.join(__dirname, 'fixtures', 'log-exceptions.js')]),
            exception = path.join(__dirname, 'fixtures', 'logs', 'exception.log');
        
        tryUnlink(exception);
        child.on('exit', function () {
          fs.readFile(exception, that.callback);
        });
      },
      "should save the error information to the specified file": function (err, data) {
        assert.isTrue(!err);
        data = JSON.parse(data);
        
        assert.isObject(data);
        helpers.assertProcessInfo(data.process);
        helpers.assertOsInfo(data.os);
        //helpers.assertTrace(data.trace);
      }
    }
  }
}).export(module);