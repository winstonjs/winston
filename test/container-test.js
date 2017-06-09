/*
 * container-test.js: Tests for the Container object
 *
 * (C) 2011 Charlie Robbins
 * MIT LICENSE
 *
 */

var assert = require('assert'),
    fs = require('fs'),
    http = require('http'),
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
      "the has() method": {
        topic: function (logger, container) {
          this.callback.apply(this, arguments);
        },
        "should indicate `default-test` logger exists": function (existing, container) {
          assert.isTrue(container.has('default-test'));
        },
        "should indicate `not-has` logger doesnt exists": function (existing, container) {
          assert.isFalse(container.has('not-has'));
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
    },
    "the add() method transports rewriters and filters options to logger": {
      topic: function (container) {
        var options = {
          'rewriters': [function () { }],
          'filters':   [function () { }, function () { }],
        }
        return container.add('options-test', options);
      },
      "should respond with logger that have the rewriters/filters provided by options": function (logger) {
        assert.instanceOf(logger, winston.Logger);
        assert.equal(helpers.size(logger.rewriters), 1);
        assert.equal(helpers.size(logger.filters), 2);
      }
    }
  },
  "An instance of winston.Container with explicit transports": {
    topic: function () {
      this.port = 9412;
      this.transports = [
        new winston.transports.Http({
          port: this.port
        })
      ];

      this.container = new winston.Container({
        transports: this.transports
      });

      return null;
    },
    "the get() method": {
      topic: function (container) {
        var server = http.createServer(function (req, res) {
          res.end();
        });

        server.listen(this.port, this.callback.bind(this, null));
      },
      "should add the logger correctly": function () {
        this.someLogger = this.container.get('some-logger');
        assert.isObject(this.someLogger.transports);
        assert.instanceOf(this.someLogger.transports['http'], winston.transports.Http);
        assert.strictEqual(this.someLogger.transports['http'], this.transports[0]);
      },
      "a second call to get()": {
        "should respond with the same transport object": function () {
          this.someOtherLogger = this.container.get('some-other-logger');

          assert.isObject(this.someOtherLogger.transports);
          assert.instanceOf(this.someOtherLogger.transports['http'], winston.transports.Http);
          assert.strictEqual(this.someOtherLogger.transports['http'], this.transports[0]);
          assert.strictEqual(this.someOtherLogger.transports['http'], this.someLogger.transports['http']);
        }
      }
    }
  }
}).export(module);
