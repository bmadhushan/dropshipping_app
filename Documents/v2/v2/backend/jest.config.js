export default {
  testEnvironment: 'node',
  preset: 'es2022',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'models/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js']
}