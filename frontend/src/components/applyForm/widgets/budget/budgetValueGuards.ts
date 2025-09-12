import { get } from "lodash";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function asMoney(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function getStringOrUndefined(
  source: unknown,
  path: string,
): string | undefined {
  const candidate: unknown = get(source as object, path);
  return typeof candidate === "string" ? candidate : undefined;
}
