const baseConfig = require('../jest.config');

/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
module.exports = {
  ...baseConfig,
  rootDir: '../',
  testMatch: [
    '<rootDir>/test/unit/**/*.test.js'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    './lib/**/*.js'
  ],
  // Reset mocks before each test to ensure clean state
  resetMocks: true
};
