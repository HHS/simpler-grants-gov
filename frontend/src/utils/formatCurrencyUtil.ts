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
