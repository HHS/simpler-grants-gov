// number-formatters.ts
// Formats numeric string values for stable text assertions in UI validations.
// Usage: import { formatNumberWithCommas } from "tests/e2e/utils/common/number-formatters";

export const formatNumberWithCommas = (value: string) => {
  return Number(value).toLocaleString("en-US");
};
