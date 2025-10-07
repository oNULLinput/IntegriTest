module.exports = {
  testEnvironment: "jsdom",
  // setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],  // ← REMOVE THIS LINE
  testMatch: ["<rootDir>/tests/**/*.test.js", "<rootDir>/tests/**/*.spec.js"],
  collectCoverageFrom: ["public/**/*.js", "!public/**/*.min.js", "!public/**/node_modules/**"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/public/$1",
  },
  globals: {
    window: {},
    document: {},
    localStorage: {},
    sessionStorage: {},
  },
}
