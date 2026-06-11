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
  const raw = (value ?? "").replace(/,/g, "");
  return Number(raw) || 0;
};
