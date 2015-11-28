/*
 * config.test.js: Tests for winston.format
 *
 * (C) 2015 Charlie Robbins
 * MIT LICENSE
 *
 */

var assume = require('assume'),
    winston = require('../../lib/winston');

describe('winston.format', function () {
  it('has the expected default formats', function () {
    assume(winston.format).is.a('function');
    assume(winston.format.cli).is.a('function');
    assume(winston.format.colorize).is.a('function');
    assume(winston.format.json).is.a('function');
    assume(winston.format.logstash).is.a('function');
    assume(winston.format.padLevels).is.a('function');
    assume(winston.format.prettyPrint).is.a('function');
    assume(winston.format.splat).is.a('function');
    assume(winston.format.simple).is.a('function');
    assume(winston.format.uncolorize).is.a('function');
  });
});
