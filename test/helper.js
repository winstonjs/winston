/*
 * helpers.js: Test helpers for winston
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

require.paths.unshift(require('path').join(__dirname, '..', 'lib'));
 
var fs = require('fs'),
    util = require('util'),
    path = require('path'),
    vows = require('vows'),
    assert = require('assert'),
    winston = require('winston');
    loggly = require('loggly');

var helpers = exports;

helpers.loadConfig = function () {
  try {
    var configFile = path.join(__dirname, 'data', 'test-config.json'),
        stats = fs.statSync(configFile)
        config = JSON.parse(fs.readFileSync(configFile).toString());
    if (config.subdomain === 'test-subdomain' 
        || config.auth.username === 'test-username'
        || config.auth.password === 'test-password') {
      util.puts('Config file test-config.json must be updated with valid data before running tests');
      process.exit(0);
    }

    helpers.config = config;
    return config;
  }
  catch (ex) {
    util.puts('Config file test-config.json must be created with valid data before running tests');
    process.exit(0);
  }
};

helpers.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};


helpers.assertLogger = function (logger) {
  assert.instanceOf(logger, winston.Logger);
  assert.isFunction(logger.log);
  assert.isFunction(logger.add);
  assert.isFunction(logger.remove);
  assert.equal(logger.level, "info");
};

helpers.assertConsole = function (transport) {
  assert.instanceOf(transport, winston.Transports.Console);
  assert.isFunction(transport.log);
};

helpers.assertRiak = function (transport) {
  assert.instanceOf(transport, winston.Transports.Riak);
  assert.isFunction(transport.log);
};