/*
 * logger.test.js: Tests for instances of the winston Logger
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

'use strict';

const assume = require('assume');
const { LEVEL, MESSAGE, SPLAT } = require('triple-beam');
const winston = require('../../lib/winston');
const { format } = winston;
const helpers = require('../helpers');

function assumeExpectedInfo(info, target = {}) {
  const expected = Object.assign({}, {
    level: 'info',
    message: 'Errors lack .toJSON() lulz'
  }, target);

  assume(info).is.an('object');
  assume(info).includes('level');
  assume(info).includes('message');

  assume(info.level).equals(expected.level);
  assume(info[LEVEL]).equals(expected.level);
  assume(info.message).equals(expected.message);
  assume(info[MESSAGE]).equals(expected.message);

  Object.keys(expected).forEach(key => {
    if (key === 'level' || key === 'message') return;
    assume(info[key]).equals(expected[key]);
  });
}

describe('format.errors (integration)', function () {
  it('logger.log(level, error)', (done) => {
    const logger = helpers.createLogger(function (info) {
      assumeExpectedInfo(info);
      done();
    }, format.errors());

    logger.log('info', new Error('Errors lack .toJSON() lulz'));
  });

  it('logger.log(level, error, meta)', (done) => {
    const meta = {
      thisIsMeta: true,
      anyValue: 'a string'
    };

    const logger = helpers.createLogger(function (info) {
      assumeExpectedInfo(info, meta);
      done();
    }, format.errors());

    logger.log('info', new Error('Errors lack .toJSON() lulz'), meta);
  });

  it('logger.log(level, msg, meta<error>)');

  it.skip('logger.<level>(error)', (done) => {

  });

  it('logger.<level>(error, meta)');
  it('logger.<level>(msg, meta<error>)');

  it(`Promise.reject().catch(logger.<level>)`, function (done) {
    const logger = helpers.createLogger(function (info) {
      assumeExpectedInfo(info, { level: 'error' });
      done();
    }, format.errors());

    new Promise((done, reject) => {
      throw new Error('Errors lack .toJSON() lulz')
    }).catch(logger.error.bind(logger));

  });
});
