export const formatDollars = (
  numberToFormat: number | null | undefined,
  alwaysIncludeCents = false,
) => {
  if (typeof numberToFormat === "number" && Number.isFinite(numberToFormat)) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits:
        alwaysIncludeCents || !Number.isInteger(numberToFormat) ? 2 : 0,
    }).format(numberToFormat);
  }
  return "";
};
