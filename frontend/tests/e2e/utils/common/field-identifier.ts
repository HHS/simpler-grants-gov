// field-identifier.ts
// Builds consistent field identifiers for attachment names and error context.
// Usage: import { buildFieldIdentifier } from "tests/e2e/utils/common/field-identifier";

import { type FieldType, type FillFieldDefinition } from "./types";

type PageIdentifierInput = {
  label: string;
  type: FieldType;
};

export function buildFieldIdentifier(field: FillFieldDefinition): string;
export function buildFieldIdentifier(field: PageIdentifierInput): string;
export function buildFieldIdentifier(
  field: FillFieldDefinition | PageIdentifierInput,
): string {
  if ("section" in field || "field" in field) {
    const formField = field as FillFieldDefinition;
    return formField.section
      ? `${formField.section}-${formField.field}`
      : formField.field;
  }

  const pageField = field as PageIdentifierInput;
  return `${pageField.label}-${pageField.type}`;
}