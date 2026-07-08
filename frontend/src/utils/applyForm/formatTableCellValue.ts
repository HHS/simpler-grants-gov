import { UiSchemaTableNumberFormat } from "src/types/applyForm/types";

type TableCellValue = number | string | null | undefined;

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

    case "dollar":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(numericValue);

    case "percentage":
      return `${new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericValue)}%`;

    default:
      return String(numericValue);
  }
};
