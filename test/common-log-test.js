/*
 * common-log-test.js: Tests for the common module
 *
 * (C) 2016 Charlie Robbins
 * MIT LICENSE
 *
 */

var assert = require('assert'),
    vows = require('vows'),
    common = require('../lib/winston/common');

vows.describe('winston/common/log').addBatch({
  "with meta set to an error": {
    topic: common.log({
      level: 'warn', message: '', meta: new RangeError('custom message'),
      prettyPrint: false, label: null, depth: null,
      humanreadableunhandledexception: false
    }),
    "should start with the error name and message": function (output) {
      assert.equal(output.split("\n")[0], 'warn:  RangeError: custom message');
    },
    "should end with the stack trace": function (output) {
      var lines = output.split("\n"),
          firstStackLine = lines[1],
          lastStackLine = lines[lines.length - 1];

      assert(/^\s+at .*test\/common-log-test.js:\d+:\d+\)?$/.test(firstStackLine), firstStackLine);
      assert(/^\s+at .*:\d+:\d+\)?$/.test(lastStackLine), lastStackLine);
    }
  },
  "with an error with custom properties": {
    topic: function() {
      var error = new TypeError('custom message');

      error.property = 'custom value';
      return common.log({
        level: 'warn', message: '', meta: error,
        prettyPrint: false, label: null, depth: null,
        humanreadableunhandledexception: false
      });
    },
    "should start with the error properties": function (output) {
      var firstLine = output.split("\n")[0],
          properties = {};

      assert(/^warn:  /.test(firstLine), firstLine);

      firstLine.substring(5).split(",").forEach(function (line) {
        var keyValue = line.trim().split("=");
        properties[keyValue[0]] = keyValue[1];
      });
      assert.deepEqual(properties, { name: 'TypeError', message: 'custom message', property: 'custom value' });
    },
    "should continue with the error serialization": function (output) {
      assert.equal(output.split("\n")[1], ' TypeError: custom message');
    },
    "should end with the stack trace": function (output) {
      var lines = output.split("\n"),
          firstStackLine = lines[2],
          lastStackLine = lines[lines.length - 1];

      assert(/^\s+at .*test\/common-log-test.js:\d+:\d+\)?$/.test(firstStackLine), firstStackLine);
      assert(/^\s+at .*:\d+:\d+\)?$/.test(lastStackLine), lastStackLine);
    }
  },
  "with an error with custom properties and prettyPrint=true": {
    topic: function() {
      var error = new TypeError('custom message');

      error.property = 'custom value';
      return common.log({
        level: 'warn', message: '', meta: error,
        prettyPrint: true, label: null, depth: null,
        humanreadableunhandledexception: false
      });
    },
    "should start with the error properties": function (output) {
      var properties = output.split("\n").slice(1, 4).join(' ').replace(/'/g, '"').replace(/(\w+):/g, '"$1":');

      assert.equal(output.split("\n")[0], 'warn:  ');
      assert.deepEqual(JSON.parse(properties), { name: 'TypeError', message: 'custom message', property: 'custom value' });

    },
    "should continue with the error serialization": function (output) {
      assert.equal(output.split("\n")[4], ' TypeError: custom message');
    },
    "should end with the stack trace": function (output) {
      var lines = output.split("\n"),
          firstStackLine = lines[5],
          lastStackLine = lines[lines.length - 1];

      assert(/^\s+at .*test\/common-log-test.js:\d+:\d+\)?$/.test(firstStackLine), firstStackLine);
      assert(/^\s+at .*:\d+:\d+\)?$/.test(lastStackLine), lastStackLine);
    }
  },
  "with an error with custom properties and custom prettyPrint function": {
    topic: function() {
      var error = new TypeError('custom message');
      error.property = 'custom value';
      return common.log({
        level: 'warn', message: '', meta: error,
        prettyPrint: function (object) {
          assert.deepEqual(object, { name: 'TypeError', message: 'custom message', property: 'custom value' });
          return 'prettyPrintOutput';
        },
        label: null, depth: null,
        humanreadableunhandledexception: false
      });
    },
    "should start with the function output": function (output) {
      assert.equal(output.split("\n")[0], 'warn:  prettyPrintOutput');
    },
    "should continue with the error serialization": function (output) {
      assert.equal(output.split("\n")[1], ' TypeError: custom message');
    },
    "should end with the stack trace": function (output) {
      var lines = output.split("\n"),
          firstStackLine = lines[2],
          lastStackLine = lines[lines.length - 1];

      assert(/^\s+at .*test\/common-log-test.js:\d+:\d+\)?$/.test(firstStackLine), firstStackLine);
      assert(/^\s+at .*:\d+:\d+\)?$/.test(lastStackLine), lastStackLine);
    }
  }
}).export(module);
