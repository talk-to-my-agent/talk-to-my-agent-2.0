export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: [
    '**/?(*.)+(spec|test).[jt]s?(x)',
    '**/?(*.)+(spec|test).mjs'
  ],
  collectCoverageFrom: [
    '**/*.{js,mjs}',
    '!**/node_modules/**',
    '!**/test-utils.mjs',
    '!**/debug.html',
    '!**/test.html',
    '!babel.config.js',
    '!jest.config.js',
    '!**/*.test.mjs',
    '!**/*.spec.mjs'
  ],
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    }
  },
  testTimeout: 10000,
  verbose: true,
  setupFilesAfterEnv: [],
  moduleFileExtensions: ['js', 'mjs', 'json'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/'
  ]
};