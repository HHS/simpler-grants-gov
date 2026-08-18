import { FrontendErrorDetails } from "src/types/apiResponseTypes";
import { z } from "zod";

import {
  getFieldSchema,
  isFieldInSchema,
  unwrapSchema,
  ZodSchema,
} from "./zodFormData";

type ValidationTranslator = {
  has: (key: string) => boolean;
  (key: string): string;
};

export function getValidationTypeFromZodIssue(
  issue: z.ZodIssue,
  value: unknown,
  fieldSchema: ZodSchema,
): string | null {
  if (value === "") {
    const { nullable, optional } = unwrapSchema(fieldSchema);

    if (!nullable && !optional) {
      return "required";
    }
  }

  switch (issue.code) {
    case z.ZodIssueCode.too_small:
    case z.ZodIssueCode.too_big:
      return "min_or_max_value";

    case z.ZodIssueCode.invalid_type:
      if (issue.received === "undefined") {
        return "required";
      }

      if (issue.received === "null") {
        return "not_null";
      }

      return "invalid";

    case z.ZodIssueCode.invalid_string:
      return "invalid";

    case z.ZodIssueCode.custom:
      return issue.message;

    default:
      return null;
  }
}

export function getTranslatedValidationMessage(
  fieldTranslations: ValidationTranslator,
  genericTranslations: ValidationTranslator,
  field: string,
  type: string | null,
  fallbackMessage: string,
): string {
  if (!type) {
    return fallbackMessage;
  }

  const fieldKey = `${field}.${type}`;

  if (fieldTranslations.has(fieldKey)) {
    return fieldTranslations(fieldKey);
  }

  if (genericTranslations.has(type)) {
    return genericTranslations(type);
  }

  return fallbackMessage;
}

export function getZodValidationErrors(
  error: z.ZodError,
  validationData: Record<string, unknown>,
  schema: z.ZodTypeAny,
  fieldTranslations: ValidationTranslator,
  genericTranslations: ValidationTranslator,
  field?: string,
): Record<string, string[]> {
  const validationErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const issueField = issue.path[0]?.toString();

    if (!issueField || !isFieldInSchema(schema, issueField)) {
      continue;
    }

    if (field && issueField !== field) {
      continue;
    }

    const fieldSchema = getFieldSchema(schema, issueField);

    if (!fieldSchema) {
      continue;
    }

    const validationType = getValidationTypeFromZodIssue(
      issue,
      validationData[issueField],
      fieldSchema,
    );

    const message = getTranslatedValidationMessage(
      fieldTranslations,
      genericTranslations,
      issueField,
      validationType,
      issue.message,
    );

    validationErrors[issueField] = [
      ...(validationErrors[issueField] ?? []),
      message,
    ];
  }

  return validationErrors;
}

export function mapApiValidationErrors(
  response: { errors?: unknown[] | null; message?: string },
  schema: z.ZodTypeAny,
  fieldTranslations: ValidationTranslator,
  genericTranslations: ValidationTranslator,
  genericMessage: string,
): {
  validationErrors?: Record<string, string[]>;
  errorMessage?: string;
} {
  const validationErrors: Record<string, string[]> = {};
  const unmappedMessages: string[] = [];

  for (const rawError of response.errors ?? []) {
    const error = rawError as FrontendErrorDetails;
    const field = error.field;

    if (field && isFieldInSchema(schema, field)) {
      const message = getTranslatedValidationMessage(
        fieldTranslations,
        genericTranslations,
        field,
        error.type ?? null,
        error.message ?? genericMessage,
      );

      validationErrors[field] = [...(validationErrors[field] ?? []), message];
    } else {
      unmappedMessages.push(error.message ?? genericMessage);
    }
  }

  const hasFieldErrors = Object.keys(validationErrors).length > 0;

  return {
    validationErrors: hasFieldErrors ? validationErrors : undefined,
    errorMessage:
      unmappedMessages.length > 0
        ? unmappedMessages.join(" ")
        : hasFieldErrors
          ? undefined
          : response.message || genericMessage,
  };
}
