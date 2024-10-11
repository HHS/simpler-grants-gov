import { formatDate } from "src/utils/dateUtil";

describe("formatDate", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });
  it("returns empty string when an incorrectly formatted string is passed", () => {
    expect(formatDate(null)).toEqual("");
    expect(formatDate("")).toEqual("");
    expect(formatDate("Wednesday")).toEqual("");
    expect(formatDate("20241010")).toEqual("");
    expect(formatDate(Date.now().toString())).toEqual("");
    expect(formatDate("24-10-10")).toEqual("");
  });

  it("returns a human readable string for properly formatted dates", () => {
    expect(formatDate("2024-10-10")).toBe("October 10, 2024");
  });
});
