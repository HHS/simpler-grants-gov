/**
 * @file Sets up the testing framework for each test file
 * @see https://jestjs.io/docs/en/configuration#setupfilesafterenv-array
 */
require("@testing-library/jest-dom");
const { toHaveNoViolations } = require("jest-axe");

expect.extend(toHaveNoViolations);

/**
 * Mock environment variables
 */
process.env.apiUrl = "http://localhost";
