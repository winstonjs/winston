/*
 * logger.test.js: Tests for instances of the winston Logger
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

'use strict';

const assume = require('assume');
const { MESSAGE, SPLAT } = require('triple-beam');
const winston = require('../../lib/winston');
const { format } = winston;
const helpers = require('../helpers');

describe('format.errors (integration)', function () {
  it('logger.log(level, error)', (done) => {
    const logger = helpers.createLogger(function (info) {
      console.dir(info);
      done();
    }, format.errors());

    logger.log('info', new Error('Errors lack .toJSON() lulz'));
  });

  it('logger.log(level, error, meta)');
  it('logger.log(level, msg, meta<error>)');

  it('logger.<level>(error)', (done) => {

  });

  it('logger.<level>(error, meta)');
  it('logger.<level>(msg, meta<error>)');

  it.only(`Promise.reject().catch(logger.<level>)`, function (done) {
    const logger = helpers.createLogger(function (info) {
      console.dir(info);
      done();
    }, format.errors());

    new Promise((done, reject) => {
      throw new Error('Errors lack .toJSON() lulz')
    }).catch(logger.error.bind(logger));

  });
});
