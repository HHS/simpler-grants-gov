// number-formatters.ts
// Formats numeric string values for stable text assertions in UI validations.
// Usage: import { formatNumberWithCommas } from "tests/e2e/utils/common/number-formatters";

export const formatNumberWithCommas = (value: string) => {
  return Number(value).toLocaleString("en-US");
};

export const stripCommasFromNumberString = (value: string) => {
  const raw = value.replace(/,/g, "");
  if (!raw || isNaN(Number(raw))) return value;
  return Number(raw).toLocaleString("en-US");
};
