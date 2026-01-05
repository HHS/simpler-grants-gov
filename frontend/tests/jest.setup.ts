/**
 * @file Sets up the testing framework for each test file
 * @see https://jestjs.io/docs/configuration#setupfilesafterenv-array
 */

import "@testing-library/jest-dom";
import { toHaveNoViolations } from "jest-axe";

// Extend Jest matchers (jest-axe)
expect.extend(toHaveNoViolations);

// Mock environment variables
process.env.apiUrl = "http://localhost";


jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const React = require("react");
    return React.createElement("img", { ...props, alt: props.alt ?? "" });
  },
}));