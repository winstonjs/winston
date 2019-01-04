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

function assumeErrorInfo(info) {
  assume(info).is.an('object');
  assume(info).includes('level');
  assume(info).includes('message');

  assume(info.level).equals('error');
  assume(info[LEVEL]).equals('error');
  assume(info.message).equals('Errors lack .toJSON() lulz');
  assume(info[MESSAGE]).equals('Errors lack .toJSON() lulz');
}

describe('format.errors (integration)', function () {
  it('logger.log(level, error)', (done) => {
    const logger = helpers.createLogger(function (info) {
      assumeErrorInfo(info);
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
      assumeErrorInfo(info);
      done();
    }, format.errors());

    new Promise((done, reject) => {
      throw new Error('Errors lack .toJSON() lulz')
    }).catch(logger.error.bind(logger));

  });
});
