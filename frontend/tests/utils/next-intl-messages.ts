import type { AbstractIntlMessages } from "next-intl";

type UnknownRecord = Record<string, unknown>;

function isPlainObject(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function toAbstractIntlMessages(input: unknown): AbstractIntlMessages {
  if (!isPlainObject(input)) return {};

  const out: Record<string, string | AbstractIntlMessages> = {};

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") out[key] = value;
    else if (isPlainObject(value)) out[key] = toAbstractIntlMessages(value);
  }

  return out as AbstractIntlMessages;
}
