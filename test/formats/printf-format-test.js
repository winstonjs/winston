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
    "the log() method": {
      "when passed undefined should not throw": function (logger) {
        assert.doesNotThrow(function () { logger.log('info', undefined) });
      },
      "when passed an Error object as meta": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.log('info', 'An error happened: ', new Error('I am something bad'));
        },
        "should respond with a proper error output": function (transport, level, msg, meta) {
          assert.instanceOf(meta, Error);
        }
      },
      "when passed a string placeholder": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.log('info', 'test message %s', 'my string');
        },
        "should interpolate": function (transport, level, msg, meta) {
          assert.strictEqual(msg, 'test message my string');
        },
      },
      "when passed a number placeholder": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.log('info', 'test message %d', 123);
        },
        "should interpolate": function (transport, level, msg, meta) {
          assert.strictEqual(msg, 'test message 123');
        },
      },
      "when passed a json placholder and an empty object": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.log('info', 'test message %j', {number: 123}, {});
        },
        "should interpolate": function (transport, level, msg, meta) {
          assert.strictEqual(msg, 'test message {"number":123}');
        },
      },
      "when passed just JSON meta and no message": {
        topic: function (logger) {
          stdMocks.use();
          logger.once('logging', this.callback);
          logger.log('info', { message: 'in JSON object', ok: true });
        },
        "should output the message": function (transport, level, msg, meta) {
          stdMocks.restore();

          //
          // TODO: Come up with a cleaner way to test this.
          //
          var output = stdMocks.flush(),
              line   = output.stdout[0];

          assert.match(line, /message\=in/);
        }
      },
      "when passed a escaped percent sign": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.log('info', 'test message %%', {number: 123});
        },
        "should not interpolate": function (transport, level, msg, meta) {
          assert.strictEqual(msg, util.format('test message %%'));
          assert.deepEqual(meta, {number: 123});
        },
      },
      "when passed interpolation strings and a meta object": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.log('info', 'test message %s, %s', 'first', 'second' ,{number: 123});
        },
        "should interpolate and have a meta object": function (transport, level, msg, meta) {
          assert.strictEqual(msg, 'test message first, second');
          assert.deepEqual(meta, {number: 123});
        },
      },
      "when passed multiple strings and a meta object": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.log('info', 'test message', 'first', 'second' , {number: 123});
        },
        "should join and have a meta object": function (transport, level, msg, meta) {
          assert.strictEqual(msg, 'test message first second');
          assert.deepEqual(meta, {number: 123});
        },
      },
      "when passed interpolations strings, meta object and a callback": {
        topic: function (logger) {
          var that = this;
          logger.log('info', 'test message %s, %s', 'first', 'second' , {number: 123}, function(transport, level, msg, meta){
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
          logger.log('info', 'test message', 'first', 'second' , {number: 123}, function(transport, level, msg, meta){
            that.callback(transport, level, msg, meta)
          });
        },
        "should join and have a meta object": function (transport, level, msg, meta) {
          assert.strictEqual(msg, 'test message first second');
          assert.deepEqual(meta, {number: 123});
        },
      },
      "when passed a regular expression": {
        topic: function (logger) {
          var that = this;
          logger.log('info', new RegExp('a'), function(transport, level, msg, meta){
            that.callback(transport, level, msg, meta)
          });
        },
        "should return a string representing the regular expression": function (transport, level, msg, meta) {
          assert.strictEqual(msg, '/a/');
        },
      }
    }
  }
}).export(module);
