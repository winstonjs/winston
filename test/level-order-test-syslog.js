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
  "Winston using the syslog config": {
    topic: function(){
      var logger = new (winston.Logger)({
        transports: [
          new (winston.transports.Console)()
        ]
      });

      logger.setLevels(winston.config.syslog.levels);
      return logger;
    },
    "the emergency level": {
      "is equal to zero": function(logger){
        assert.strictEqual(logger.getLevels().emerg, 0);
      },
      "is of a higher priority than alert": function(logger){
        assert.ok(logger.shouldWriteMessage({"level":"alert"}, "emerg"));
      }
    },
    "the alert level": {
      "is equal to one": function(logger){
        assert.strictEqual(logger.getLevels().alert, 1);
      },
      "is of a higher priority than crit": function(logger){
        assert.ok(logger.shouldWriteMessage({"level":"crit"}, "alert"));
      }
    },
    "the crit level": {
      "is equal to two": function(logger){
        assert.strictEqual(logger.getLevels().crit, 2);
      },
      "is of a higher priority than error": function(logger){
        assert.ok(logger.shouldWriteMessage({"level":"error"}, "crit"));
      }
    },
    "the error level": {
      "is equal to three": function(logger){
        assert.strictEqual(logger.getLevels().error, 3);
      },
      "is of a higher priority than warning": function(logger){
        assert.ok(logger.shouldWriteMessage({"level":"warning"}, "error"));
      }
    },
    "the warning level": {
      "is equal to four": function(logger){
        assert.strictEqual(logger.getLevels().warning, 4);
      },
      "is of a higher priority than notice": function(logger){
        assert.ok(logger.shouldWriteMessage({"level":"notice"}, "warning"));
      }
    },
    "the notice level": {
      "is equal to five": function(logger){
        assert.strictEqual(logger.getLevels().notice, 5);
      },
      "is of a higher priority than info": function(logger){
        assert.ok(logger.shouldWriteMessage({"level":"info"}, "notice"));
      }
    },
    "the info level": {
      "is equal to six": function(logger){
        assert.strictEqual(logger.getLevels().info, 6);
      },
      "is of a higher priority than debug": function(logger){
        assert.ok(logger.shouldWriteMessage({"level":"debug"}, "info"));
      }
    },
    "the debug level": {
      "is equal to seven": function(logger){
        assert.strictEqual(logger.getLevels().debug, 7);
      }
    },
  }
}).export(module);
