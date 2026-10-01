import { formatTableCellValue } from "src/utils/applyForm/formatTableCellValue";

describe("formatTableCellValue", () => {
  it("returns an empty string for missing values", () => {
    expect(formatTableCellValue(undefined)).toBe("");
    expect(formatTableCellValue(null)).toBe("");
    expect(formatTableCellValue("")).toBe("");
  });

  it("returns an empty string for non-numeric values", () => {
    expect(formatTableCellValue("not a number")).toBe("");
  });

  it("renders an unformatted numeric value", () => {
    expect(formatTableCellValue(1234.5)).toBe("1234.5");
    expect(formatTableCellValue("2500")).toBe("2500");
  });

  it("formats integer values", () => {
    expect(formatTableCellValue(1234.56, "integer")).toBe("1,235");
  });

  it("formats decimal values with two decimal places", () => {
    expect(formatTableCellValue(1234.5, "decimal")).toBe("1,234.50");
  });

  it("formats currency values with two decimal places", () => {
    expect(formatTableCellValue(1234.5, "currency")).toBe("1,234.50");
  });

  it("formats dollar values with a dollar sign", () => {
    expect(formatTableCellValue(1234.5, "dollar")).toBe("$1,234.50");
  });

  it("formats percentage values without scaling the numeric value", () => {
    expect(formatTableCellValue(12.5, "percentage")).toBe("12.50%");
  });

  it("accepts numeric strings", () => {
    expect(formatTableCellValue("1234.5", "decimal")).toBe("1,234.50");
  });
});
