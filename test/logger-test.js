/*
 * logger-test.js: Tests for instances of the winston Logger
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

require.paths.unshift(require('path').join(__dirname, '..', 'lib'));

var path = require('path'),
    vows = require('vows'),
    assert = require('assert'),
    winston = require('winston'),
    helpers = require('./helpers');

vows.describe('winton/logger').addBatch({
  "An instance of winston.Logger": {
    topic: new (winston.Logger)({ transports: { console: { level: "info" }}}), 
    "should have the correct methods / properties defined": function (logger) {
      helpers.assertLogger(logger);
    },
    "the add() with an unsupported transport": {
      "should throw an error": function () {
        assert.throws(function () { logger.add('unsupported') }, Error);
      }
    }
  }
}).addBatch({
  "An instance of winston.Logger with no transports": {
    topic: new (winston.Logger)(),
    "the log() method should throw an error": function (logger) {
      assert.throws(function () { logger.log('anything') }, Error);
    },
    "the add() method with a supported transport": {
      topic: function (logger) {       
        return logger.add("console");  
      },
      "should add the console Transport onto transports": function (logger) {
        assert.equal(helpers.size(logger.transports), 1);
        helpers.assertConsole(logger.transports.Console);
      },
      "should throw an error when the same Transport is added": function (logger) {
        assert.throws(function () { logger.add('console') }, Error);
      },
      "the log() method": {
        topic: function (logger) {
          logger.once('log', this.callback);
          logger.log('info', 'test message');
        },
        "should emit the 'log' event with the appropriate transport": function (transport, ign) {
          helpers.assertConsole(transport);
        }
      },
      "and adding an additional transport": {
        topic: function (logger) {       
          return logger.add("Riak", {}); 
        },
        "should be able to add multiple transports": function (logger) {
          assert.equal(helpers.size(logger.transports), 2);
          helpers.assertConsole(logger.transports.Console);
          helpers.assertRiak(logger.transports.Riak);
        }
      }
    }
  }
}).addBatch({
  "The winston logger": {
    topic: new (winston.Logger)({ transports: { console: {}, riak: {} } }),
    "should return have two transports": function(logger) {
      assert.equal(helpers.size(logger.transports), 2);
    },
    "the remove() with an unadded transport": {
      "should throw an Error": function (logger) {
       assert.throws(function () { logger.remove('loggly') }, Error);
      }
    },
    "the remove() method with an added transport": {
      topic: function (logger) {
         return logger.remove('console');  
      },
      "should remove the Console transport from transports": function (logger) {
        assert.equal(helpers.size(logger.transports), 1);
        helpers.assertRiak(logger.transports.Riak);
      },
      "and removing an additional transport": {
        topic: function (logger) {
           return logger.remove('riak');  
        },
        "should remove Riak transport from transports": function (logger) {
          assert.equal(helpers.size(logger.transports), 0);
        }
      }
    }
  }
}).export(module);