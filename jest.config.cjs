module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testMatch: ['**/src/**/?(*.)+(spec|test).[tj]s?(x)'],
  roots: ['<rootDir>/src', '<rootDir>/dist/tests']
};
