/*
 * logger-legacy.test.js: Tests for Legacy APIs of winston < 3.0.0
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

'use strict';

const assume = require('assume');
const path = require('path');
const stream = require('readable-stream');
const util = require('util');
const isStream = require('is-stream');
const stdMocks = require('std-mocks');
const { MESSAGE } = require('triple-beam');
const winston = require('../lib/winston');
const LegacyTransport = require('./helpers/mocks/legacy-transport');
const LegacyMixedTransport = require('./helpers/mocks/legacy-mixed-transport');
const TransportStream = require('winston-transport');
const helpers = require('./helpers');

/*
 * Assumes that the `TransportClass` with the given { name, displayName }
 * are properly handled by a winston Logger.
 */
function assumeAcceptsLegacy({ displayName, name, TransportClass }) {
  return function () {
    it(`.add(${name})`, function () {
      stdMocks.use();
      var logger = winston.createLogger();
      var transport = new TransportClass();
      logger.add(transport);
      stdMocks.restore();
      var output = stdMocks.flush();

      assume(logger._readableState.pipesCount).equals(1);
      assume(logger._readableState.pipes.transport).is.an('object');
      assume(logger._readableState.pipes.transport).equals(transport);
      assume(output.stderr.join('')).to.include(`${name} is a legacy winston transport. Consider upgrading`);
    });

    it(`.add(${name}) multiple`, function () {
      stdMocks.use();
      var logger = winston.createLogger({
        transports: [
          new TransportClass(),
          new TransportClass(),
          new TransportClass()
        ]
      });

      stdMocks.restore();
      var output = stdMocks.flush();

      assume(logger._readableState.pipesCount).equals(3);
      var errorMsg = `${name} is a legacy winston transport. Consider upgrading`;
      assume(output.stderr.join('')).to.include(errorMsg);
    });

    it('.remove() [LegacyTransportStream]', function () {
      var transports = [
        new winston.transports.Console(),
        new TransportClass()
      ];

      const logger = winston.createLogger({ transports: transports });
      assume(logger.transports.length).equals(2);
      logger.remove(transports[1]);
      assume(logger.transports.length).equals(1);
      assume(logger.transports[0]).equals(transports[0]);
    });
  };
}

describe('Logger (legacy API)', function () {
  it('new Logger({ DEPRECATED })', function () {
    var deprecated = [
      { colors: true },
      { emitErrs: true },
      { formatters: [] },
      { padLevels: true },
      { rewriters: [] },
      { stripColors: true }
    ];

    deprecated.forEach(function (opts) {
      assume(function () {
        var logger = winston.createLogger(opts)
      }).throws(/Use a custom/);
    });
  });

  describe(
    'LegacyTransport (inherits from winston@2 Transport)',
    assumeAcceptsLegacy({
      displayName: 'LegacyTransport',
      TransportClass: LegacyTransport,
      name: 'legacy-test'
    })
  );

  describe(
    'LegacyMixedTransport (inherits from winston@3 Transport)',
    assumeAcceptsLegacy({
      displayName: 'LegacyMixedTransport',
      TransportClass: LegacyMixedTransport,
      name: 'legacy-mixed-test'
    })
  );

  it('.cli() throws', function () {
    var logger = winston.createLogger();
    assume(logger.cli).throws(/Use a custom/);
  });
});
