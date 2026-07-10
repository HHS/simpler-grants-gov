export function coerceBoolean(input: unknown): boolean | undefined {
  if (typeof input === "boolean") return input;
  if (typeof input === "string") {
    const v = input.trim().toLowerCase();
    if (v === "true") return true;
    if (v === "false") return false;
  }
  return undefined;
}
