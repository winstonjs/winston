/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
module.exports = {
  collectCoverage: false,
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
      functions: 70.00,
      lines: 70.85,
      statements: 70.54,
      branches: 61.51
    }
  }
};

