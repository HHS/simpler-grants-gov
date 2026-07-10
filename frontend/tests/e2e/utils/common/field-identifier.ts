/**
 * Builds consistent field identifiers for attachment names and error context.
 * Usage: import { buildFieldIdentifier } from "tests/e2e/utils/common/field-identifier";
 */

import { type FieldType, type FillFieldDefinition } from "./types";

type PageIdentifierInput = {
  label: string;
  type: FieldType;
};

/** Creates a stable identifier for logging, attachments, and error messages. */
export function buildFieldIdentifier(
  field: FillFieldDefinition | PageIdentifierInput,
): string {
  if ("section" in field || "field" in field) {
    return field.section ? `${field.section}-${field.field}` : field.field;
  }

  return `${field.label}-${field.type}`;
}
