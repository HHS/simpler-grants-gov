import { formatFullName } from "src/utils/userNameUtils";

describe("formatFullName", () => {
  it("returns a single space when user is null", () => {
    expect(formatFullName(null)).toBe(" ");
  });

  it("returns a single space when user is undefined", () => {
    expect(formatFullName(undefined)).toBe(" ");
  });

  it("joins first, middle, and last names", () => {
    expect(
      formatFullName({
        first_name: "Ada",
        middle_name: "Agnes",
        last_name: "Lovelace",
      }),
    ).toBe("Ada Agnes Lovelace");
  });

  it("skips a missing middle name", () => {
    expect(
      formatFullName({
        first_name: "Grace",
        middle_name: null,
        last_name: "Hopper",
      }),
    ).toBe("Grace Hopper");
  });

  it("skips a missing first and middle name", () => {
    expect(
      formatFullName({
        first_name: null,
        middle_name: null,
        last_name: "Solo",
      }),
    ).toBe("Solo");
  });

  it("skips empty-string values", () => {
    expect(
      formatFullName({
        first_name: "",
        middle_name: null,
        last_name: "Solo",
      }),
    ).toBe("Solo");
  });

  it("returns an empty string when every name part is empty", () => {
    expect(
      formatFullName({
        first_name: "",
        middle_name: "",
        last_name: "",
      }),
    ).toBe("");
  });
});
