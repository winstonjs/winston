/*
 * rejection-test.js: Tests for rejection data gathering in winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

const baseHandlerTests = require('../../helpers/handler-tests');
const helpers = require('../../helpers');

describe('UnhandledRejectionHandler', function () {
  this.timeout(100);

  baseHandlerTests({
    name: 'RejectionHandler',
    helper: 'rejectionHandler',
    setup: 'clearRejections',
    listener: 'unhandledRejection',
    toggleSetting: 'handleRejections',
    trigger: msg => helpers.reject(new Error(msg))
  });
});
