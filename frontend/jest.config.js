// See https://nextjs.org/docs/testing
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js front end to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.js"],
  testEnvironment: "jsdom",
  // if using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
  moduleDirectories: ["node_modules", "<rootDir>/"],
  testPathIgnorePatterns: ["<rootDir>/tests/e2e"],
};

module.exports = createJestConfig(customJestConfig);
