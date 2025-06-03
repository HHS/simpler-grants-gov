export const formatCurrency = (number: number | null) => {
    if (number) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
      }).format(number);
    }
    return "";
  };