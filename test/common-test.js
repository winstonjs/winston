/*
 * common-test.js: Tests for the common module
 *
 * (C) 2016 Charlie Robbins
 * MIT LICENSE
 *
 */

var assert = require('assert'),
    vows = require('vows'),
    common = require('../lib/winston/common');

vows.describe('winston/common/clone').addBatch({
  "with a vanilla error": {
    topic: common.clone(new RangeError('custom error message')),
    "should clone the 'name' property": function (cloned) {
      assert.equal(cloned.name, 'RangeError');
    },
    "should clone the 'message' property": function (cloned) {
      assert.equal(cloned.message, 'custom error message');
    },
    "should clone the 'message', 'name', and 'stack' properties": function (cloned) {
      assert.deepEqual(Object.keys(cloned).sort(), ['message', 'name', 'stack']);
    }
  },
  "with an error with custom properties": {
    topic: function() {
      var error = new TypeError('custom message');
      error.property = 'custom value';
      return common.clone(error);
    },
    "should clone the custom property": function (cloned) {
      assert.equal(cloned.property, 'custom value');
    },
    "should clone the 'message', 'name', 'stack' and custom property": function (cloned) {
      assert.ok(cloned.stack);
      delete cloned.stack;
      assert.deepEqual(cloned, { name: "TypeError", message: 'custom message', property: 'custom value' });
    }
  }
}).export(module);
