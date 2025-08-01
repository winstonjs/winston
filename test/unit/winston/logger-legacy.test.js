/*
 * logger-legacy.test.js: Tests for Legacy APIs of winston < 3.0.0
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

'use strict';

const assume = require('assume');
const winston = require('../../../lib/winston');
const LegacyTransport = require('../../helpers/mocks/legacy-transport');
const LegacyMixedTransport = require('../../helpers/mocks/legacy-mixed-transport');

describe('Deprecated APIs', function () {
  describe('Instantiation Options', function () {
    const deprecatedOptionTestCases = [
      { colors: true },
      { emitErrs: true },
      { formatters: [] },
      { padLevels: true },
      { rewriters: [] },
      { stripColors: true }
    ];

    it.each(deprecatedOptionTestCases)('should throw when instantiating with deprecated option of %s', function (option) {
      const invalidInstantiation = () => winston.createLogger(option);

      assume(invalidInstantiation).throws(/Use a custom/);
    });
  });

  describe('Instance methods', function () {
    const deprecatedMethodTestCases = ['cli'];

    it.each(deprecatedMethodTestCases)(
      'should throw when invoking deprecated %s() instance method', function (deprecatedMethod) {
        const logger = winston.createLogger();

        assume(logger[deprecatedMethod]).throws(/Use a custom/);
      });
  });


  describe('Transports', () => {
    const legacyTransportTestCases = [
      {
        scenario: 'Transport inheriting from winston@2',
        transport: LegacyTransport
      },
      {
        scenario: 'Transport inheriting from winston@3 but conforming to winston@2 API',
        transport: LegacyMixedTransport
      }
    ];

    describe.each(legacyTransportTestCases)('$scenario', ({ transport: TransportClass }) => {
      let consoleErrorSpy;
      let logger;
      const expectedDeprecationMessage = `${new TransportClass().name} is a legacy winston transport. Consider upgrading`;
      const getCallsToConsoleError = () => consoleErrorSpy.mock.calls.length;
      const getFlatConsoleErrorOutput = () => consoleErrorSpy.mock.calls.flat().join('');

      beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, 'error');
      });

      afterEach(() => {
        jest.resetAllMocks();
      });

      it(`.add() is successful but logs deprecation notice`, function () {
        const expectedTransport = new TransportClass();
        logger = winston.createLogger();

        logger.add(expectedTransport);

        assume(logger._readableState.pipesCount).equals(1);
        assume(getCallsToConsoleError()).equals(1);
        assume(getFlatConsoleErrorOutput()).to.include(expectedDeprecationMessage);
      });

      it(`.add() multiple transports is successful but logs deprecation notice`, function () {
        logger = winston.createLogger();

        logger.add(new TransportClass());
        logger.add(new TransportClass());
        logger.add(new TransportClass());


        assume(logger._readableState.pipesCount).equals(3);
        assume(getCallsToConsoleError()).equals(3);
        assume(getFlatConsoleErrorOutput()).to.include(expectedDeprecationMessage);
      });

      it('.remove() is successful', function () {
        const consoleTransport = new winston.transports.Console();
        const legacyTransport = new TransportClass();

        logger = winston.createLogger();
        logger.add(consoleTransport);
        logger.add(legacyTransport);

        assume(logger.transports.length).equals(2);
        logger.remove(legacyTransport);
        assume(logger.transports.length).equals(1);
        assume(logger.transports[0]).equals(consoleTransport);
      });
    });
  });
});
