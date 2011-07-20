/*
 * helpers.js: Test helpers for winston
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var fs = require('fs'),
    util = require('util'),
    path = require('path'),
    vows = require('vows'),
    assert = require('assert'),
    winston = require('../lib/winston'),
    loggly = require('loggly')
    
var helpers = exports;

helpers.loadConfig = function (dir) {
  try {
    if (helpers.config) return helpers.config;
    var configFile = path.join(dir || __dirname, 'fixtures', 'test-config.json'),
        stats = fs.statSync(configFile),
        config = JSON.parse(fs.readFileSync(configFile).toString());
    
    helpers.config = config;
    return config;
  }
  catch (ex) {
    util.puts('test/fixtures/test-config.json must be created with valid data before running tests');
    process.exit(0);
  }
};

helpers.size = function(obj) {
  var size = 0, key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      size++;
    }
  }
  
  return size;
};

helpers.assertLogger = function (logger, level) {
  assert.instanceOf(logger, winston.Logger);
  assert.isFunction(logger.log);
  assert.isFunction(logger.add);
  assert.isFunction(logger.remove);
  assert.equal(logger.level, level || "info");
  Object.keys(logger.levels).forEach(function (method) {
    assert.isFunction(logger[method]);
  });
};

helpers.assertConsole = function (transport) {
  assert.instanceOf(transport, winston.transports.Console);
  assert.isFunction(transport.log);
};

helpers.assertFile = function (transport) {
  assert.instanceOf(transport, winston.transports.File);
  assert.isFunction(transport.log);
}

helpers.assertLoggly = function (transport) {
  assert.instanceOf(transport, winston.transports.Loggly);
  assert.isFunction(transport.log);  
};

helpers.assertWebhook = function (transport) {
  assert.instanceOf(transport, winston.transports.Webhook);
  assert.isFunction(transport.log);
};

helpers.testNpmLevels = function (transport, assertMsg, assertFn) {
  return helpers.testLevels(winston.config.npm.levels, transport, assertMsg, assertFn);
};

helpers.testSyslogLevels = function (transport, assertMsg, assertFn) {
  return helpers.testLevels(winston.config.syslog.levels, transport, assertMsg, assertFn);
};

helpers.testLevels = function (levels, transport, assertMsg, assertFn) {
  var tests = {};
  
  Object.keys(levels).forEach(function (level) {
    var test = {
      topic: function () {
        transport.log(level, 'test message', {}, this.callback.bind(this, null));
      }
    };
   
    test[assertMsg] = assertFn;
    tests['with the ' + level + ' level'] = test;
  });
  
  var test = {
    topic: function () {
      transport.log('info', 'test message', { metadata: true }, this.callback.bind(this, null));
    }
  };
  
  test[assertMsg] = assertFn;
  tests['when passed metadata'] = test;
  return tests;
};