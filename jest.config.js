/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
module.exports = {
  collectCoverage: false,
  collectCoverageFrom: [
    '<rootDir>/lib/**/*.js'
  ],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/test/**/*.test.js'
  ],
  globalSetup: '<rootDir>/test/globalSetup.js',
  silent: true,
  verbose: true,
  coverageThreshold: {
    global: {
      functions: 74.54,
      lines: 72.48,
      statements: 72.25,
      branches: 64.04
    }
  }
};

