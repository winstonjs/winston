/*
 * log-rewriter-test.js: Tests for rewriting metadata in winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var assert = require('assert'),
    vows = require('vows'),
    winston = require('../lib/winston'),
    util = require('util'),
    helpers = require('./helpers');

vows.describe('winston/logger/levels').addBatch({
  "The winston logger": {
    topic: new (winston.Logger)({
      transports: [
        new (winston.transports.Console)()
      ]
    }),
    "the info() method": {
      "when passed metadata": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.info('test message', {foo: 'bar'});
        },
        "should have metadata object": function (transport, level, msg, meta) {
          assert.strictEqual(msg, 'test message');
          assert.deepEqual(meta, {foo: 'bar'});
        }
         }
        },
      "when passed a string placeholder": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.info('test message %s', 'my string');
        },
        "should interpolate": function (transport, level, msg, meta) {
          assert.strictEqual(msg, 'test message my string');
        },
      },
      "when passed a number placeholder": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.info('test message %d', 123);
        },
        "should interpolate": function (transport, level, msg, meta) {
          assert.strictEqual(msg, 'test message 123');
        },
      },
      "when passed a json placholder and an empty object": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.info('test message %j', {number: 123}, {});
        },
        "should interpolate": function (transport, level, msg, meta) {
          assert.strictEqual(msg, 'test message {"number":123}');
        },
      },
      "when passed a escaped percent sign": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.info('test message %%', {number: 123});
        },
        "should not interpolate": function (transport, level, msg, meta) {
          assert.strictEqual(msg, util.format('test message %%'));
          assert.deepEqual(meta, {number: 123});
        },
      },
      "when passed interpolation strings and a meta object": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.info('test message %s, %s', 'first', 'second' ,{number: 123});
        },
        "should interpolate and have a meta object": function (transport, level, msg, meta) {
          assert.strictEqual(msg, 'test message first, second');
          assert.deepEqual(meta, {number: 123});
        },
      },
      "when passed multiple strings and a meta object": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.info('test message', 'first', 'second' , {number: 123});
        },
        "should join and have a meta object": function (transport, level, msg, meta) {
          assert.strictEqual(msg, 'test message first second');
          assert.deepEqual(meta, {number: 123});
        },
      },
      "when passed interpolations strings, meta object and a callback": {
        topic: function (logger) {
          var that = this;
          logger.info('test message %s, %s', 'first', 'second' , {number: 123}, function(transport, level, msg, meta){
            that.callback(transport, level, msg, meta)
          });
        },
        "should interpolate and have a meta object": function (transport, level, msg, meta) {
          assert.strictEqual(msg, 'test message first, second');
          assert.deepEqual(meta, {number: 123});
        },
      },
      "when passed multiple strings, a meta object and a callback": {
        topic: function (logger) {
          var that = this;
          logger.info('test message', 'first', 'second' , {number: 123}, function(transport, level, msg, meta){
            that.callback(transport, level, msg, meta)
          });
        },
        "should join and have a meta object": function (transport, level, msg, meta) {
          assert.strictEqual(msg, 'test message first second');
          assert.deepEqual(meta, {number: 123});
        }
      }
    }
}).addBatch({
  "An instance of winston.Logger": {
    topic: function () {
      return new (winston.Logger)({ transports: [ new (winston.transports.Memory)() ] });
    },

    "with logging level higher": {
      topic: function (logger) {
        logger.level = 'info';
        return logger;
      },

      "than logging level of incoming message": {
        topic: function (logger) {
          var that = this;
          logger.debug('hello world', function () {
            that.callback(null, logger.transports.memory);
          });
        },

        "should not log such message": function (memory) {
          assert.equal(memory.writeOutput.length, 0);
        }
      }
    },

    "with transport with logging level higher": {
      topic: function (logger) {
        logger.transports.memory.level = 'info';
        return logger;
      },

      "than logging level of incoming message": {
        topic: function (logger) {
          var that = this;
          logger.debug('hello world', function () {
            that.callback(null, logger.transports.memory);
          });
        },
        "should not log such message": function (memory) {
          assert.equal(memory.writeOutput.length, 0);
        }
      }
    }
  }
}).export(module);
