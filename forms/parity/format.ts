/** Display text for raw facts in the public parity result. */
import type { FlatField, Position } from "./index.ts";

const REQUIRED = {
  yes: "Required",
  no: "Optional",
  conditional: "Conditional",
};

export function showRequired(field: FlatField | undefined): string | null {
  return field?.required ? REQUIRED[field.required] : null;
}

export function showLength(field: FlatField | undefined): string | null {
  const { minLength: min, maxLength: max } = field?.rules ?? {};
  if (min === undefined && max === undefined) return null;
  if (min !== undefined && max !== undefined) return `${min}–${max} characters`;
  return min !== undefined
    ? `At least ${min} characters`
    : `Up to ${max} characters`;
}

export function showRules(
  field: FlatField | undefined,
  keywords: readonly ("pattern" | "format" | "minimum" | "maximum")[],
): string | null {
  const stated = keywords.flatMap((keyword) => {
    const value = field?.rules[keyword];
    return value === undefined ? [] : [`${keyword} ${value}`];
  });
  return stated.length ? stated.join(" · ") : null;
}

const listOf = (value: unknown): string[] | undefined =>
  Array.isArray(value) ? value.map(String) : undefined;

export function showOptions(field: FlatField | undefined): string | null {
  const type = field?.rules.enumType;
  const values = listOf(field?.rules.enum);
  const count = values && `${values.length} values`;
  if (type && count) return `${type} (${count})`;
  return (type as string | undefined) ?? count ?? null;
}

/** Render already-resolved neighbors; no artifact ordering or field lookup occurs here. */
export function showPosition(position: Position | undefined): string | null {
  if (!position) return null;
  return [
    position.before ? `After ${position.before}` : "First",
    position.after ? `before ${position.after}` : "last",
  ].join(" · ");
}
