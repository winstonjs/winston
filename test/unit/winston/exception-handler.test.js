/*
 * exception-test.js: Tests for exception data gathering in winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

const baseHandlerTests = require('../../helpers/handler-tests');
const helpers = require('../../helpers');

describe('ExceptionHandler', function () {
  this.timeout(100);

  baseHandlerTests({
    name: 'ExceptionHandler',
    helper: 'exceptionHandler',
    setup: 'clearExceptions',
    listener: 'uncaughtException',
    toggleSetting: 'handleExceptions',
    trigger: msg => helpers.throw(msg)
  });
});
