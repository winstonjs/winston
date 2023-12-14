/*
 * exception-test.js: Tests for exception data gathering in winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

const baseHandlerTests = require('../../helpers/handlers');
const helpers = require('../../helpers');

describe('ExceptionHandler', function () {
  this.timeout(100);

  baseHandlerTests({
    name: 'ExceptionHandler',
    helper: 'exceptionHandler',
    getAllInfo: new Error('catpants'),
    setup: 'clearExceptions',
    listener: 'uncaughtException',
    toggleSetting: 'handleExceptions',
    trigger: msg => helpers.throw(msg)
  });
});
