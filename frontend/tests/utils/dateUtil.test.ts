import { identity } from "lodash";
import { formatDate } from "src/utils/dateUtil";

describe("formatDate", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(identity);
  });
  it("returns empty string when an invalid date string is passed", () => {
    expect(formatDate(null)).toEqual("");
    expect(formatDate("")).toEqual("");
    expect(formatDate("Wednesday")).toEqual("");
    expect(formatDate("20")).toEqual("");
    expect(formatDate(Date.now().toString())).toEqual("");
    expect(formatDate("24-10-10")).toEqual("");
  });

  it("returns a human readable string for properly formatted dates", () => {
    expect(formatDate("2024-10-10")).toBe("October 10, 2024");
    expect(formatDate("20241010")).toBe("October 10, 2024");
  });

  it("invokes console warn when date string does not contain 3 parts", () => {
    const logSpy = jest.spyOn(global.console, "warn");
    formatDate("10-1019999");
    expect(logSpy).toHaveBeenCalledWith(
      "invalid date string provided for parse",
    );
  });
});
