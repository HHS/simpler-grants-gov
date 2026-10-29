export const formatCurrency = (numberToFormat: number | null) => {
  if (numberToFormat) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(numberToFormat);
  }
  return "";
};

/** Parses a currency-like string (e.g. "$1,234" or "1234") and formats as USD, or returns the original string if not numeric. */
export const formatCurrencyString = (value?: string) => {
  if (!value) return "";

  const parsedValue = Number(value.replace(/[$,\s]/g, ""));
  if (Number.isNaN(parsedValue)) return value;

  return formatCurrency(parsedValue);
};

export const getNumericAmountFromString = (
  value: string | null | undefined,
): number => {
  const raw = (value ?? "").replace(/[$,\s]/g, "");
  return Number(raw) || 0;
};

/**
 * Strips non-numeric characters from a currency input while typing.
 * Matches the budget amount input behavior: digits, optional leading minus,
 * a single decimal point, and at most two decimal places.
 */
export const sanitizeCurrencyInput = (value: string): string => {
  let next = value.replace(/[^0-9.-]/g, "");
  next = next.replace(/(?!^)-/g, "");
  const parts = next.split(".");
  if (parts.length > 2) {
    next = `${parts[0]}.${parts.slice(1).join("")}`;
  }
  if (parts[1]?.length > 2) {
    next = `${parts[0]}.${parts[1].slice(0, 2)}`;
  }
  return next;
};
