import { formatCurrency, formatCurrencyString, getNumericAmountFromString } from "src/utils/formatCurrencyUtil";

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
    expect(formatCurrency(1234.56)).toBe("$1,235");
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

describe("getNumericAmountFromString", () => {
  it("returns 0 when null is passed", () => {
    expect(getNumericAmountFromString(null)).toBe(0);
  });

  it("returns 0 when undefined is passed", () => {
    expect(getNumericAmountFromString(undefined)).toBe(0);
  });

  it("returns 0 when empty string is passed", () => {
    expect(getNumericAmountFromString("")).toBe(0);
  });

  it("parses a comma-separated number string", () => {
    expect(getNumericAmountFromString("1,234")).toBe(1234);
  });

  it("parses a plain number string", () => {
    expect(getNumericAmountFromString("500")).toBe(500);
  });

  it("returns 0 for non-numeric strings", () => {
    expect(getNumericAmountFromString("abc")).toBe(0);
  });
});
