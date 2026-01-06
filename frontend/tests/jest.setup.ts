import "@testing-library/jest-dom";

import { toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

process.env.apiUrl = "http://localhost";

const originalError = console.error;
const originalWarn = console.warn;

let errorSpy: jest.SpyInstance<void, unknown[]>;
let warnSpy: jest.SpyInstance<void, unknown[]>;

beforeEach(() => {
  errorSpy = jest
    .spyOn(console, "error")
    .mockImplementation((...args: unknown[]) => {
      const first = args[0];

      if (
        typeof first === "string" &&
        first.includes("Header and data content have mismatched link")
      ) {
        return;
      }

      originalError(...args);
    });

  warnSpy = jest
    .spyOn(console, "warn")
    .mockImplementation((...args: unknown[]) => {
      originalWarn(...args);
    });
});

afterEach(() => {
  errorSpy.mockRestore();
  warnSpy.mockRestore();

  jest.resetModules();
});
