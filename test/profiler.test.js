'use strict';

/*
 * profiler.js: Tests for exception simple profiling.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

const assume = require('assume');
const Profiler = require('../lib/winston/profiler');

describe('Profiler', () => {
  it('new Profiler()', () => {
    assume(() => new Profiler()).throws();
  });

  it('.done({ info })', done => {
    const profiler = new Profiler({
      write(info) {
        assume(info).is.an('object');
        assume(info.something).equals('ok');
        assume(info.level).equals('info');
        assume(info.durationMs).is.a('number');
        assume(info.message).equals('testing1');
        done();
      }
    });

    setTimeout(() => {
      profiler.done({
        something: 'ok',
        level: 'info',
        message: 'testing1'
      });
    }, 200);
  });
});
