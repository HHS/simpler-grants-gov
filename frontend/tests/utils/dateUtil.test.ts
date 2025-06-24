import { identity } from "lodash";
import {
  formatDate,
  isExpired,
  isExpiring,
  toShortMonthDate,
} from "src/utils/dateUtil";

jest.mock("src/constants/auth", () => ({
  clientTokenRefreshInterval: 1000,
}));

describe("formatDate", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(identity);
  });
  it("returns empty string when an invalid date string is passed", () => {
    expect(formatDate(null)).toEqual("");
    expect(formatDate("")).toEqual("");
    expect(formatDate("Wednesday")).toEqual("");
    expect(formatDate("20241010")).toBe("");
    expect(formatDate("24-10-10")).toEqual("");
    expect(formatDate(Date.now().toString())).toEqual("");
  });

  it("returns a human readable string for properly formatted dates", () => {
    expect(formatDate("2024-10-10")).toBe("October 10, 2024");
  });

  it("invokes console warn when date string does not contain 3 parts", () => {
    const logSpy = jest.spyOn(global.console, "warn");
    formatDate("10-1019999");
    expect(logSpy).toHaveBeenCalledWith(
      "invalid date string provided for parse",
    );
  });
});

describe("isExpiring", () => {
  it("returns false if no expiration", () => {
    expect(isExpiring()).toEqual(false);
  });
  it("returns false if expiration is more than the refresh interval in the future", () => {
    expect(isExpiring(Date.now() + 1001)).toEqual(false);
  });
  it("returns false if expiration is in the past", () => {
    expect(isExpiring(Date.now() - 1)).toEqual(false);
  });
  it("returns true if expiration falls within the refresh interval", () => {
    expect(isExpiring(Date.now() + 500)).toEqual(true);
  });
});

describe("isExpired", () => {
  it("returns false if no expiration", () => {
    expect(isExpired()).toEqual(false);
  });
  it("returns true if expiration is in the past", () => {
    expect(isExpired(Date.now() - 1)).toEqual(true);
  });
  it("returns false if expiration is in the future", () => {
    expect(isExpired(Date.now() + 1)).toEqual(false);
  });
});

describe("toShortMonthDate", () => {
  it("converts dates to the `short month` format", () => {
    expect(toShortMonthDate("2025-01-25")).toEqual("Jan 25, 2025");
    expect(toShortMonthDate("01-25-2025")).toEqual("Jan 25, 2025");
    expect(toShortMonthDate("1-1-2025")).toEqual("Jan 1, 2025");
    expect(toShortMonthDate("1-1-25")).toEqual("Jan 1, 2025");
  });
  it("returns an empty string if input is invalid", () => {
    expect(toShortMonthDate("January 25th Twenty Twenty FIve")).toEqual("");
  });
});
