/*
 * container-test.js: Tests for the Container object
 *
 * (C) 2011 Charlie Robbins
 * MIT LICENSE
 *
 */

const assume = require('assume');
const winston = require('../lib/winston');

describe('Container', function () {
  describe('no transports', function () {
    var container = new winston.Container();
    var defaultTest;

    it('.add(default-test)', function () {
      defaultTest = container.add('default-test');
      assume(defaultTest.log).is.a('function');
    });

    it('.get(default-test)', function () {
      assume(container.get('default-test')).equals(defaultTest);
    });

    it('.has(default-test)', function () {
      assume(container.has('default-test')).true();
    });

    it('.has(not-has)', function () {
      assume(container.has('not-has')).false();
    });

    it('.close(default-test)', function () {
      container.close('default-test');
      assume(container.loggers.has('default-test')).falsy();
    });

    it('.close(non-existent)', function () {
      container.close('non-existent');
      assume(container.loggers.has('non-existent')).falsy();
    });

    it('.close()', function () {
      container.close();
      assume(container.loggers.has()).falsy();
    });
  });

  describe('explicit transports', function () {
    var transports = [new winston.transports.Http({ port: 9412 })];
    var container = new winston.Container({ transports: transports });
    var all = {};

    it('.get(some-logger)', function () {
      all.someLogger = container.get('some-logger');
      assume(all.someLogger._readableState.pipes).instanceOf(winston.transports.Http);
      assume(all.someLogger._readableState.pipes).equals(transports[0]);
    });

    it('.get(some-other-logger)', function () {
      all.someOtherLogger = container.get('some-other-logger');

      assume(all.someOtherLogger._readableState.pipes).instanceOf(winston.transports.Http);
      assume(all.someOtherLogger._readableState.pipes).equals(transports[0]);
      assume(all.someOtherLogger._readableState.pipes).equals(all.someLogger._readableState.pipes);
    });
  });
});
