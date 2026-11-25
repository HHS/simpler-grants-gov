import { formatDollars } from "src/utils/formatCurrencyUtil";

describe("formatDollars", () => {
  it("returns empty string when null is passed", () => {
    expect(formatDollars(null)).toBe("");
  });

  it("does not return empty string when 0 is passed", () => {
    expect(formatDollars(0)).toBe("$0");
  });

  it("formats positive integers as USD with no fraction digits", () => {
    expect(formatDollars(1000)).toBe("$1,000");
  });

  it("formats small numbers", () => {
    expect(formatDollars(42)).toBe("$42");
  });

  it("formats numbers that require commas", () => {
    expect(formatDollars(1000000)).toBe("$1,000,000");
  });

  it("formats cent values", () => {
    expect(formatDollars(1234.56)).toBe("$1,234.56");
  });

  it("pads decimal values to two digits", () => {
    expect(formatDollars(1234.5)).toBe("$1,234.50");
  });

  it("adds zero-value cents when `alwaysIncludeCents` is true", () => {
    expect(formatDollars(1234, true)).toBe("$1,234.00");
  });
});
