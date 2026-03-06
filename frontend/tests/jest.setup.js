/* global jest */

/**
 * @file Sets up the testing framework for each test file
 * @see https://jestjs.io/docs/en/configuration#setupfilesafterenv-array
 */
require("@testing-library/jest-dom");
const { toHaveNoViolations } = require("jest-axe");
const { expect } = require("@jest/globals");
const {
  useTranslationsMock,
  mockMessages,
} = require("src/utils/testing/intlMocks");

expect.extend(toHaveNoViolations);

/**
 * Mock environment variables
 */
process.env.apiUrl = "http://localhost";

/**
 * Always mock next-intl functions
 */
jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
  useMessages: () => mockMessages,
}));
