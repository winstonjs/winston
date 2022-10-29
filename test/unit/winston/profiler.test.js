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
describe('Profiler', function () {
  it('new Profiler()', function () {
    assume(function () {
      new Profiler();
    }).throws();
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
});
