/*
 * level-order-test.js: Regression test for making sure log levels stay in the correct order
 *
 * (C) 2013 Michael Heap
 * MIT LICENSE
 *
 */

var assert = require('assert'),
vows = require('vows'),
winston = require('../lib/winston');

vows.describe('winston/levels/order/npm').addBatch({
  "Winston using the npm config": {
    topic: function(){
      var logger = new (winston.Logger)({
        transports: [
          new (winston.transports.Console)()
        ]
      });
      return logger;
    },
    "the error level": {
      "is equal to zero": function(logger){
        assert.strictEqual(logger.getLevels().error, 0);
      },
      "is of a higher priority than warn": function(logger){
        assert.ok(logger.shouldWriteMessage({"level":"warn"}, "error"));
      }
    },
    "the warn level": {
      "is equal to one": function(logger){
        assert.strictEqual(logger.getLevels().warn, 1);
      },
      "is of a higher priority than crit": function(logger){
        assert.ok(logger.shouldWriteMessage({"level":"info"}, "warn"));
      }
    },
    "the info level": {
      "is equal to two": function(logger){
        assert.strictEqual(logger.getLevels().info, 2);
      },
      "is of a higher priority than error": function(logger){
        assert.ok(logger.shouldWriteMessage({"level":"debug"}, "info"));
      }
    },
    "the debug level": {
      "is equal to three": function(logger){
        assert.strictEqual(logger.getLevels().debug, 3);
      },
      "is of a higher priority than verbosej": function(logger){
        assert.ok(logger.shouldWriteMessage({"level":"verbose"}, "debug"));
      }
    },
    "the verbose level": {
      "is equal to four": function(logger){
        assert.strictEqual(logger.getLevels().verbose, 4);
      },
      "is of a higher priority than silly": function(logger){
        assert.ok(logger.shouldWriteMessage({"level":"silly"}, "verbose"));
      }
    },
    "the silly level": {
      "is equal to five": function(logger){
        assert.strictEqual(logger.getLevels().silly, 5);
      }
    }
  }
}).export(module);
