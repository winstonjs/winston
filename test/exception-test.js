/*
 * cli-test.js: Tests for the cli levels available in winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var path = require('path'),
    vows = require('vows'),
    assert = require('assert'),
    winston = require('../lib/winston'),
    helpers = require('./helpers');

vows.describe('winston/exception').addBatch({
  "When using the winston exception module": {
    "the getProcessInfo() method": {
      topic: winston.exception.getProcessInfo(),
      "should respond with the appropriate data": function (info) {
        assert.isNumber(info.pid);
        assert.isNumber(info.uid);
        assert.isNumber(info.gid);
        assert.isString(info.cwd);
        assert.isString(info.execPath);
        assert.isString(info.version);
        assert.isArray(info.argv);
        assert.isObject(info.memoryUsage);
      }
    },
    "the getOsInfo() method": {
      topic: winston.exception.getOsInfo(),
      "should respond with the appropriate data": function (info) {
        assert.isArray(info.loadavg);
        assert.isNumber(info.uptime);
      }
    },
    "the getTrace() method": {
      topic: winston.exception.getTrace(new Error()),
      "should have the appropriate info": function (trace) {
        trace.forEach(function (site) {
          assert.isTrue(!site.column || typeof site.column === 'number');
          assert.isTrue(!site.line || typeof site.line === 'number');
          assert.isTrue(!site.file || typeof site.file === 'string');
          assert.isTrue(!site.method || typeof site.method === 'string');
          assert.isTrue(!site.function || typeof site.function === 'string');
          assert.isTrue(typeof site.native === 'boolean');
        });
      }
    },
    "the getAllInfo() method": {
      topic: winston.exception.getAllInfo(new Error()),
      "should have the appropriate info": function (info) {
        assert.isObject(info);
        assert.isObject(info.process);
        assert.isObject(info.os);
        assert.isArray(info.trace);
      }
    }
  }
}).export(module);