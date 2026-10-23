/** Compare positive decimal steps without binary floating-point remainder errors. */
export function isDecimalMultiple(value: number, divisor: number): boolean {
  if (![value, divisor].every((n) => Number.isFinite(n) && n > 0)) return false;
  const decimal = (n: number) => {
    const [mantissa, exponent = "0"] = n.toString().toLowerCase().split("e");
    const [whole, fraction = ""] = mantissa.split(".");
    return {
      coefficient: BigInt(whole + fraction),
      scale: fraction.length - Number(exponent),
    };
  };
  const a = decimal(value),
    b = decimal(divisor);
  const scale = Math.max(a.scale, b.scale);
  return (
    (a.coefficient * 10n ** BigInt(scale - a.scale)) %
      (b.coefficient * 10n ** BigInt(scale - b.scale)) ===
    0n
  );
}
