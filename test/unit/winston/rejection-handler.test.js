/*
 * rejection-test.js: Tests for rejection data gathering in winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

const baseHandlerTests = require('../../helpers/handler-tests');

describe('UnhandledRejectionHandler', function () {
  jest.setTimeout(100);

  baseHandlerTests({
    name: 'RejectionHandler',
    helper: 'rejectionHandler',
    setup: 'clearRejections',
    listener: 'unhandledRejection',
    toggleSetting: 'handleRejections'
  });
});
