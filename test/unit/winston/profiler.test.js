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

  it('accepts a Logger created from a different copy of the `Logger` module (e.g. duplicated/hoisted install or test-runner module reset)', function () {
    // Regression test for https://github.com/winstonjs/winston/issues/2432:
    // `new Profiler(logger)` used to reject an otherwise valid winston
    // Logger whenever it was constructed against a different in-memory
    // copy of the `./logger` class (an `instanceof` check across two
    // "copies" of the same module always fails, even though both copies
    // define an identical class). This happens for reasons outside the
    // caller's control, e.g. a duplicated nested `winston` install, or
    // (as reported in the issue) a test runner such as Jest resetting its
    // module registry between test files.
    jest.resetModules();
    const createLogger = require('../../../lib/winston/create-logger');
    const logger = createLogger({});

    // Force a fresh copy of `./logger` (and therefore `./profiler`, which
    // requires it) to be loaded, simulating the module-duplication
    // scenario from the issue.
    jest.resetModules();
    const FreshProfiler = require('../../../lib/winston/profiler');

    let profiler;
    assume(function () {
      profiler = new FreshProfiler(logger);
    }).not.throws();
    assume(profiler.logger).equals(logger);
  });
});
