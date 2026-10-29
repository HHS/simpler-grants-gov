/**
 * Shared regex helpers used by E2E selectors and assertions.
 * Usage: import { escapeRegex } from "tests/e2e/utils/common/regex-utils";
 */

/** Escapes regex meta characters so plain text can be used in RegExp safely. */
export const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const UUID_REGEX =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
