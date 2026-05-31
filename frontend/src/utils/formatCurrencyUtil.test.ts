import { formatCurrency } from "src/utils/formatCurrencyUtil";

describe("formatCurrency", () => {
  it("formats positive integers as USD", () => {
    expect(formatCurrency(1000)).toBe("$1,000");
  });

  it("formats large numbers with commas", () => {
    expect(formatCurrency(1234567)).toBe("$1,234,567");
  });

  it("returns empty string for zero (falsy input)", () => {
    expect(formatCurrency(0)).toBe("");
  });

  it("returns empty string for null", () => {
    expect(formatCurrency(null)).toBe("");
  });

  it("formats negative values", () => {
    expect(formatCurrency(-500)).toBe("-$500");
  });
});
