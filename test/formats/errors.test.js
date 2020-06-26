/*
 * errors.test.js: E2E Integration tests of `new Error()` handling
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

  it('logger.log(level, error) [custom error properties]', (done) => {
    const logger = helpers.createLogger(function (info) {
      assumeExpectedInfo(info, {
        something: true,
        wut: 'another string'
      });

      done();
    }, format.errors());

    const err = new Error('Errors lack .toJSON() lulz');
    err.something = true;
    err.wut = 'another string';

    logger.log('info', err);
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

  it('logger.log(level, error, meta) [custom error properties]', (done) => {
    const meta = {
      thisIsMeta: true,
      anyValue: 'a string'
    };

    const logger = helpers.createLogger(function (info) {
      assumeExpectedInfo(info, Object.assign({
        something: true,
        wut: 'another string'
      }, meta));

      done();
    }, format.errors());

    const err = new Error('Errors lack .toJSON() lulz');
    err.something = true;
    err.wut = 'another string';

    logger.log('info', err, meta);
  });

  it('logger.log(level, msg, meta<error>)', (done) => {
    const logger = helpers.createLogger(function (info) {
      assumeExpectedInfo(info, {
        message: 'Caught error: Errors lack .toJSON() lulz'
      });

      done();
    }, format.combine(
      format.errors(),
      format.printf(info => info.message)
    ));

    logger.log('info', 'Caught error:', new Error('Errors lack .toJSON() lulz'));
  });

  it('logger.log(level, msg, meta<error>) [custom error properties]', (done) => {
    const err = new Error('Errors lack .toJSON() lulz');
    err.something = true;
    err.wut = 'another string';

    const logger = helpers.createLogger(function (info) {
      assumeExpectedInfo(info, {
        message: 'Caught error: Errors lack .toJSON() lulz',
        stack: err.stack,
        something: true,
        wut: 'another string'
      });

      done();
    }, format.combine(
      format.errors(),
      format.printf(info => info.message)
    ));

    logger.log('info', 'Caught error:', err);
  });

  it('logger.<level>(error)', (done) => {
    const logger = helpers.createLogger(function (info) {
      assumeExpectedInfo(info);
      done();
    }, format.errors());

    logger.info(new Error('Errors lack .toJSON() lulz'));
  });

  it('logger.<level>(error) [custom error properties]', (done) => {
    const logger = helpers.createLogger(function (info) {
      assumeExpectedInfo(info, {
        something: true,
        wut: 'another string'
      });

      done();
    }, format.errors());

    const err = new Error('Errors lack .toJSON() lulz');
    err.something = true;
    err.wut = 'another string';

    logger.info(err);
  });

  it('logger.<level>(error, meta)', (done) => {
    const meta = {
      thisIsMeta: true,
      anyValue: 'a string'
    };

    const logger = helpers.createLogger(function (info) {
      assumeExpectedInfo(info, meta);
      done();
    }, format.errors());

    logger.info(new Error('Errors lack .toJSON() lulz'), meta);
  });

  it('logger.<level>(error, meta) [custom error properties]', (done) => {
    const meta = {
      thisIsMeta: true,
      anyValue: 'a string'
    };

    const logger = helpers.createLogger(function (info) {
      assumeExpectedInfo(info, Object.assign({
        something: true,
        wut: 'another string'
      }, meta));

      done();
    }, format.errors());

    const err = new Error('Errors lack .toJSON() lulz');
    err.something = true;
    err.wut = 'another string';

    logger.info(err, meta);
  });

  it('logger.<level>(msg, meta<error>)', (done) => {
    const logger = helpers.createLogger(function (info) {
      assumeExpectedInfo(info, {
        message: 'Caught error: Errors lack .toJSON() lulz'
      });

      done();
    }, format.combine(
      format.errors(),
      format.printf(info => info.message)
    ));

    logger.info('Caught error:', new Error('Errors lack .toJSON() lulz'));
  });

  it('logger.<level>(msg, meta<error>) [custom error properties]', (done) => {
    const err = new Error('Errors lack .toJSON() lulz');
    err.something = true;
    err.wut = 'another string';

    const logger = helpers.createLogger(function (info) {
      assumeExpectedInfo(info, {
        message: 'Caught error: Errors lack .toJSON() lulz',
        stack: err.stack,
        something: true,
        wut: 'another string'
      });

      done();
    }, format.combine(
      format.errors(),
      format.printf(info => info.message)
    ));

    logger.info('Caught error:', err);
  });

  it(`Promise.reject().catch(logger.<level>)`, (done) => {
    const logger = helpers.createLogger(function (info) {
      assumeExpectedInfo(info, { level: 'error' });
      done();
    }, format.errors());

    new Promise((done, reject) => {
      throw new Error('Errors lack .toJSON() lulz')
    }).catch(logger.error.bind(logger));
  });

  it(`Promise.reject().catch(logger.<level>) [custom error properties]`, (done) => {
    const logger = helpers.createLogger(function (info) {
      assumeExpectedInfo(info, {
        level: 'error',
        something: true,
        wut: 'a string'
      });

      done();
    }, format.errors());

    new Promise((done, reject) => {
      const err = new Error('Errors lack .toJSON() lulz');
      err.something = true;
      err.wut = 'a string';

      throw err;
    }).catch(logger.error.bind(logger));
  });
});
