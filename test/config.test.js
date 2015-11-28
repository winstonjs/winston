/*
 * config.test.js: Tests for winston.config
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var assume = require('assume'),
    colors = require('colors/safe'),
    winston = require('../lib/winston'),
    helpers = require('./helpers');

describe('winston.config', function () {
  var expected = Object.assign({},
    winston.config.cli.colors,
    winston.config.npm.colors,
    winston.config.syslog.colors);

  it('should have expected methods', function () {
    assume(winston.config).is.an('object');
    assume(winston.config.allColors).is.an('object');
    assume(winston.config.addColors).is.a('function');
    assume(winston.config.colorize).is.a('function');
    assume(winston.config.cli).is.an('object');
    assume(winston.config.npm).is.an('object');
    assume(winston.config.syslog).is.an('object');
    assume(winston.config.allColors).deep.equals(expected);
  });

  it('winston.addColors({ string: string })', function () {
    winston.addColors({ weird: 'cyan' });

    assume(winston.config.allColors).deep.equals(
      Object.assign({}, expected, { weird: 'cyan' })
    );
  });

  it('winston.addColors({ string: [Array] })', function () {
    winston.addColors({ multiple: ['red', 'bold'] });
    assume(winston.config.allColors.multiple).is.an('array');
    assume(winston.config.allColors.multiple).deep.equals(['red', 'bold']);
  });

  it('winston.addColors({ string: "(\w+)/s(\w+)" })', function () {
    winston.addColors({ delimited: 'blue underline' });
    assume(winston.config.allColors.delimited).deep.equals(['blue', 'underline']);
  });

  it('winston.config.colorize(level) [single color]', function () {
    assume(winston.config.colorize('weird')).equals(colors.cyan('weird'));
  });

  it('winston.config.colorize(level) [multiple colors]', function () {
    assume(winston.config.colorize('multiple')).equals(
      colors.bold(colors.red('multiple'))
    );
  });

  it('winston.config.colorize(level, message) [single color]', function () {
    assume(winston.config.colorize('weird', 'message')).equals(colors.cyan('message'));
  });

  it('winston.config.colorize(level, message) [multiple colors]', function () {
    assume(winston.config.colorize('multiple', 'message')).equals(
      colors.bold(colors.red('message'))
    );
  });
});
