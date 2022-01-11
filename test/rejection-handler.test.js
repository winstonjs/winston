/*
 * rejection-test.js: Tests for rejection data gathering in winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */


const baseHandlerTests = require('./helpers/handlers');
const helpers = require('./helpers');

describe('UnhandledRejectionHandler', function () {
  this.timeout(100);

  baseHandlerTests({
    name: 'RejectionHandler',
    helper: 'rejectionHandler',
    setup: 'clearRejections',
    listener: 'unhandledRejection',
    toggleSetting: 'handleRejections',
    trigger(msg) {
      process.on('unhandledRejection', (e, p) => console.log('my handler is called', e, p))
      process.emit('unhandledRejection', msg, helpers.reject(msg));
    }
  });
});
