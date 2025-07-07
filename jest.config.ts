import type {Config} from 'jest';

const config: Config = {
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  moduleNameMapper: {
    "@/tests/(.+)": "<rootDir>/tests/$1",
    "@/(.+)": "<rootDir>/src/$1"
  },
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  transform: {
    '\\.ts$': 'ts-jest'
  }
};

export default config;