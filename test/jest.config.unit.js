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
  coverageThreshold: {
    // global: {
    //   functions: 75.00,
    //   lines: 75.00,
    //   statements: 75.00,
    //   branches: 65.00
    // }
  },
  // Reset mocks before each test to ensure clean state
  resetMocks: true
};
