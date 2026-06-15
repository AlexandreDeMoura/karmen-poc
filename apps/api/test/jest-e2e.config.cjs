const path = require('node:path')

/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        compiler: require.resolve('typescript'),
        tsconfig: path.join(__dirname, '..', 'tsconfig.spec.json'),
      },
    ],
  },
}
