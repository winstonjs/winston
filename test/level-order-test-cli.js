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

vows.describe('winston/levels/order/syslog').addBatch({
  "Winston using the cli config": {
    topic: function(){
      var logger = new (winston.Logger)({
        transports: [
          new (winston.transports.Console)()
        ]
      });

      logger.setLevels(winston.config.cli.levels);
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
      "is of a higher priority than help": function(logger){
        assert.ok(logger.shouldWriteMessage({"level":"help"}, "warn"));
      }
    },
    "the help level": {
      "is equal to two": function(logger){
        assert.strictEqual(logger.getLevels().help, 2);
      },
      "is of a higher priority than error": function(logger){
        assert.ok(logger.shouldWriteMessage({"level":"data"}, "help"));
      }
    },
    "the data level": {
      "is equal to three": function(logger){
        assert.strictEqual(logger.getLevels().data, 3);
      },
      "is of a higher priority than warning": function(logger){
        assert.ok(logger.shouldWriteMessage({"level":"info"}, "data"));
      }
    },
    "the info level": {
      "is equal to four": function(logger){
        assert.strictEqual(logger.getLevels().info, 4);
      },
      "is of a higher priority than notice": function(logger){
        assert.ok(logger.shouldWriteMessage({"level":"debug"}, "info"));
      }
    },
    "the debug level": {
      "is equal to five": function(logger){
        assert.strictEqual(logger.getLevels().debug, 5);
      },
      "is of a higher priority than info": function(logger){
        assert.ok(logger.shouldWriteMessage({"level":"prompt"}, "debug"));
      }
    },
    "the prompt level": {
      "is equal to six": function(logger){
        assert.strictEqual(logger.getLevels().prompt, 6);
      },
      "is of a higher priority than debug": function(logger){
        assert.ok(logger.shouldWriteMessage({"level":"verbose"}, "prompt"));
      }
    },
    "the verbose level": {
      "is equal to seven": function(logger){
        assert.strictEqual(logger.getLevels().verbose, 7);
      },
      "is of a higher priority than input": function(logger){
        assert.ok(logger.shouldWriteMessage({"level":"input"}, "verbose"));
      }
    },
    "the input level": {
      "is equal to eight": function(logger){
        assert.strictEqual(logger.getLevels().input, 8);
      },
      "is of a higher priority than debug": function(logger){
        assert.ok(logger.shouldWriteMessage({"level":"silly"}, "input"));
      }
    },
    "the silly level": {
      "is equal to nine": function(logger){
        assert.strictEqual(logger.getLevels().silly, 9);
      }
    },
  }
}).export(module);
