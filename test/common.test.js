/*
 * common.test.js: Tests for lib/winston/common.js
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var assume = require('assume'),
    winston = require('../lib/winston'),
    common = require('../lib/winston/common'),
    helpers = require('./helpers');

describe('winston/common', function () {
  it('winston.paddings', function () {
    assume(winston.paddings).is.an('object');
    assume(winston.paddings).deep.equals({
      error: '  ',
      warn: '   ',
      info: '   ',
      http: '   ',
      verbose: '',
      debug: '  ',
      silly: '  '
    });
  });

  it('setLevels(syslog)', function () {
    winston.setLevels(winston.config.syslog.levels);

    assume(winston.transports).is.an('object');
    assume(winston.transports.Console).is.a('function');
    assume(winston.default.transports).is.an('array');
    assume(winston.config).is.an('object');

    var newLevels = Object.keys(winston.config.syslog.levels);
    newLevels.forEach(function (key) {
      assume(winston[key]).is.a('function');
    });

    assume(winston.paddings).deep.equals({
      emerg: '  ',
      alert: '  ',
      crit: '   ',
      error: '  ',
      warning: '',
      notice: ' ',
      info: '   ',
      debug: '  '
    });

    Object.keys(winston.config.npm.levels)
      .filter(function (key) {
        return newLevels.indexOf(key) === -1;
      })
      .forEach(function (key) {
        assume(typeof winston[key]).equals('undefined');
      });
  });

  //
  // Reset levels once we have tested setLevels works
  // as expected.
  //
  after(function () {
    winston.setLevels(winston.config.npm.levels);
  });
});
