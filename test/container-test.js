/*
 * container-test.js: Tests for the Container object
 *
 * (C) 2011 Charlie Robbins
 * MIT LICENSE
 *
 */

var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    vows = require('vows'),
    winston = require('../lib/winston'),
    helpers = require('./helpers');

vows.describe('winston/container').addBatch({
  "An instance of winston.Container": {
    topic: new winston.Container(),
    "the add() method": {
      topic: function (container) {
        return container.add('default-test');
      },
      "should correctly instantiate a Logger": function (logger) {
        assert.instanceOf(logger, winston.Logger);
      },
      "the get() method": {
        topic: function (logger, container) {
          this.callback.apply(this, arguments);
        },
        "should respond with the logger previously created": function (existing, container) {
          var logger = container.get('default-test');
          assert.isTrue(existing === logger);
        }
      },
      "the close() method": {
        topic: function (logger, container) {
          this.callback.apply(this, arguments);
        },
        "should remove the specified logger": function (logger, container) {
          container.close('default-test');
          assert.isTrue(!container.loggers['default-test']);
        }
      }
    }
  }
}).export(module);