import {
  formatCurrency,
  formatCurrencyString,
  sanitizeCurrencyInput,
} from "src/utils/formatCurrencyUtil";

describe("formatCurrency", () => {
  it("returns empty string when null is passed", () => {
    expect(formatCurrency(null)).toBe("");
  });

  it("returns empty string when 0 is passed (falsy)", () => {
    expect(formatCurrency(0)).toBe("");
  });

  it("formats positive integers as USD with no fraction digits", () => {
    expect(formatCurrency(1000)).toBe("$1,000");
  });

  it("formats small numbers", () => {
    expect(formatCurrency(42)).toBe("$42");
  });

  it("formats numbers that require commas", () => {
    expect(formatCurrency(1000000)).toBe("$1,000,000");
  });

  it("formats decimal values", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });
});

describe("formatCurrencyString", () => {
  it("returns empty string when undefined is passed", () => {
    expect(formatCurrencyString(undefined)).toBe("");
  });

  it("returns empty string when empty string is passed", () => {
    expect(formatCurrencyString("")).toBe("");
  });

  it("parses a numeric string and formats as USD", () => {
    expect(formatCurrencyString("1234")).toBe("$1,234");
  });

  it("parses a string with dollar sign and commas", () => {
    expect(formatCurrencyString("$1,234")).toBe("$1,234");
  });

  it("returns the original string when not numeric", () => {
    expect(formatCurrencyString("not a number")).toBe("not a number");
  });
});

describe("sanitizeCurrencyInput", () => {
  it("strips letters and other non-numeric characters", () => {
    expect(sanitizeCurrencyInput("12a3b")).toBe("123");
    expect(sanitizeCurrencyInput("$1,234")).toBe("1234");
  });

  it("allows a single decimal point and at most two decimal places", () => {
    expect(sanitizeCurrencyInput("12.345")).toBe("12.34");
    expect(sanitizeCurrencyInput("12.3.4")).toBe("12.34");
  });

  it("allows only a leading minus sign", () => {
    expect(sanitizeCurrencyInput("-12.5")).toBe("-12.5");
    expect(sanitizeCurrencyInput("12-5")).toBe("125");
  });

  it("returns an empty string when there are no numeric characters", () => {
    expect(sanitizeCurrencyInput("abc")).toBe("");
  });
});
