import { UiSchemaTableNumberFormat } from "src/types/applyForm/types";
import { formatCurrency } from "src/utils/formatCurrencyUtil";

type TableCellValue = number | string | null | undefined;

/**
 * Convert a numeric value to its numeric representation, or undefined if not numeric.
 * @param value - The value to parse
 * @returns The numeric value, or undefined if parsing fails or value is null/undefined
 */
const getNumericValue = (value: TableCellValue): number | undefined => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const numericValue =
    typeof value === "number" ? value : Number.parseFloat(value);

  return Number.isNaN(numericValue) ? undefined : numericValue;
};

export const formatTableCellValue = (
  value: TableCellValue,
  format?: UiSchemaTableNumberFormat,
): string => {
  const numericValue = getNumericValue(value);

  if (numericValue === undefined) {
    return "";
  }

  switch (format) {
    case "integer":
      return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 0,
      }).format(numericValue);

    case "decimal":
    case "currency":
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericValue);

    case "dollar": {
      const formatted = formatCurrency(numericValue);

      if (!formatted.includes(".")) {
        return `${formatted}.00`;
      }

      const [, fraction] = formatted.split(".");
      return fraction.length === 1 ? `${formatted}0` : formatted;
    }

    case "percentage":
      return new Intl.NumberFormat("en-US", {
        style: "percent",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericValue / 100);

    default:
      return String(numericValue);
  }
};
