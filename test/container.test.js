'use strict';

/*
 * container-test.js: Tests for the Container object
 *
 * (C) 2011 Charlie Robbins
 * MIT LICENSE
 *
 */

const assume = require('assume');
const winston = require('../lib/winston');

describe('Container', () => {
  describe('no transports', () => {
    const container = new winston.Container();
    let defaultTest;

    it('.add(default-test)', () =>  {
      defaultTest = container.add('default-test');
      assume(defaultTest.log).is.a('function');
    });

    it('.get(default-test)', () => {
      assume(container.get('default-test')).equals(defaultTest);
    });

    it('.has(default-test)', () => {
      assume(container.has('default-test')).true();
    });

    it('.has(not-has)', () => {
      assume(container.has('not-has')).false();
    });

    it('.close(default-test)', () => {
      container.close('default-test');
      assume(container.loggers.has('default-test')).falsy();
    });

    it('.close(non-existent)', () => {
      container.close('non-existent');
      assume(container.loggers.has('non-existent')).falsy();
    });

    it('.close()', () => {
      container.close();
      assume(container.loggers.has()).falsy();
    });
  });

  describe('explicit transports', () => {
    const transports = [new winston.transports.Http({ port: 9412 })];
    const container = new winston.Container({ transports });
    const all = {};

    it('.get(some-logger)', () => {
      all.someLogger = container.get('some-logger');
      assume(all.someLogger._readableState.pipes).instanceOf(winston.transports.Http);
      assume(all.someLogger._readableState.pipes).equals(transports[0]);
    });

    it('.get(some-other-logger)', () => {
      all.someOtherLogger = container.get('some-other-logger');
      assume(all.someOtherLogger._readableState.pipes).instanceOf(winston.transports.Http);
      assume(all.someOtherLogger._readableState.pipes).equals(transports[0]);
      assume(all.someOtherLogger._readableState.pipes).equals(all.someLogger._readableState.pipes);
    });
  });
});
