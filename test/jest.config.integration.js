const baseConfig = require('../jest.config');

/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
module.exports = {
  ...baseConfig,
  rootDir: '../',
  testMatch: [
    '<rootDir>/test/integration/**/*.test.js'
  ],
  // Integration tests may take longer
  testTimeout: 10000,
  // Run integration tests serially to avoid conflicts
  maxWorkers: 1
};
