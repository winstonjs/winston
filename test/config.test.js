/*
 * config.test.js: Tests for winston.config
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var assume = require('assume'),
    winston = require('../lib/winston'),
    helpers = require('./helpers');

describe('winston.config', function () {
  it('should have expected methods', function () {
    assume(winston.config).is.an('object');
    assume(winston.config.addColors).is.a('function');
    assume(winston.config.cli).is.an('object');
    assume(winston.config.npm).is.an('object');
    assume(winston.config.syslog).is.an('object');
  });
});
