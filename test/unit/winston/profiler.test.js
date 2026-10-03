/*
 * profiler.js: Tests for exception simple profiling.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

const assume = require('assume');
const Logger = require('../../../lib/winston/logger');
const Profiler = require('../../../lib/winston/profiler');
const { PassThrough } = require('stream');
describe('Profiler', function () {
  it('new Profiler()', function () {
    assume(function () {
      new Profiler();
    }).throws('Logger is required for profiling');
  });

  it('.done({ info })', function (done) {
    const logger = new Logger();
    logger.write = function (info) {
      assume(info).is.an('object');
      assume(info.something).equals('ok');
      assume(info.level).equals('info');
      assume(info.durationMs).is.a('number');
      assume(info.message).equals('testing1');
      done();
    };
    var profiler = new Profiler(logger);
    setTimeout(function () {
      profiler.done({
        something: 'ok',
        level: 'info',
        message: 'testing1'
      });
    }, 200);
  });

  it('non logger object', function(){
    assume(function() {
      new Profiler(new Error('Unknown error'));
    }).throws('Logger is required for profiling');

    assume(function () {
      new Profiler({a:'b'});
    }).throws('Logger is required for profiling');

    assume(function(){
      new Profiler([1,2,3,4]);
    }).throws('Logger is required for profiling');

    assume(function () {
      new Profiler(new PassThrough());
    }).throws('Logger is required for profiling');

    assume(function () {
      new Profiler(2);
    }).throws('Logger is required for profiling');
    
    assume(function () {
      new Profiler('1');
    }).throws('Logger is required for profiling');
  })

  it('includes logger.defaultMeta and lets explicit fields win', function () {
    const logger = new Logger({
      defaultMeta: {service: 'api', message: 'from-default'}
    });
    let written;
    logger.write = function (info) {
      written = info;
    };

    new Profiler(logger).done({
      message: 'finished',
      requestId: 'r1'
    });

    assume(written.service).equals('api');
    assume(written.requestId).equals('r1');
    assume(written.message).equals('finished');
    assume(written.level).equals('info');
    assume(written.durationMs).is.a('number');
  });
});
