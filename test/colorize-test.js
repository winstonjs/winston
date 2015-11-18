/*
 * colorize-test.js: Tests for colorizing in non-TTY environments.
 *
 * (C) 2015 Tom Spencer
 * MIT LICENSE
 *
 */

var path = require('path'),
    vows = require('vows'),
    assert = require('assert'),
    winston = require('../lib/winston'),
    spawn = require('cross-spawn-async');

var spawnTest = function(colorize, cb) {
  var data = '';
  var ps = spawn(process.execPath, [path.join(__dirname, 'fixtures', 'scripts', 'colorize.js'), colorize], { stdio: 'pipe' });

  ps.stdout.on('data', function(buf) {
    data += buf.toString();
  });

  ps.on('close', function() {
    cb(null, data);
  });
};

vows.describe('winston/colorize').addBatch({
  "When using winston in a non-TTY environment": {
    "the logger when setup with colorize: true": {
      topic: function() { spawnTest(true, this.callback) },
      "should colorize": function (log) {
        assert.strictEqual(log, '\u001b[32minfo\u001b[39m: Simply a test\n');
      }
    },
    "the logger when setup with colorize: false": {
      topic: function() { spawnTest(false, this.callback) },
      "should not colorize": function (log) {
        assert.strictEqual(log, 'info: Simply a test\n');
      }
    }
  }
}).export(module);
