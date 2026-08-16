import { z } from "zod";
import { FrontendErrorDetails } from "src/types/apiResponseTypes";
import dayjs from "dayjs";

export function getValidationTypeFromZodIssue(
  issue: z.ZodIssue,
  value: unknown,
  fieldSchema: z.ZodTypeAny,
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

    default:
      return null;
  }
}


type FormDataAdapters = Record<string, (formData: FormData) => unknown>;

export function formDataToZodInput<T extends z.ZodRawShape>(
  formData: FormData,
  schema: z.ZodObject<T>,
  adapters: FormDataAdapters = {},
) {
  const result: Record<string, unknown> = {};

  for (const [fieldName, fieldSchema] of Object.entries(schema.shape)) {
    const adapter = adapters[fieldName];

    if (adapter) {
      result[fieldName] = adapter(formData);
      continue;
    }

    const rawValue = formData.get(fieldName);
    result[fieldName] = normalizeValueForSchema(rawValue, fieldSchema);
  }

  return result;
}

function normalizeValueForSchema(
  value: FormDataEntryValue | null,
  schema: z.ZodTypeAny,
): unknown {
  const { schema: unwrappedSchema, nullable, optional } = unwrapSchema(schema);

  if (value === null) {
    if (nullable) return null;
    if (optional) return undefined;
    return undefined;
  }

  if (typeof value !== "string") {
    return value;
  }

  if (value === "") {
    if (nullable) {
      return null;
    }

    // Important: preserve "" for required strings/dates so Zod
    // can report an actual validation failure.
    return "";
  }

  if (unwrappedSchema instanceof z.ZodNumber) {
    const normalized = value.replace(/[$,\s]/g, "");
    return Number(normalized);
  }

  if (unwrappedSchema instanceof z.ZodBoolean) {
    if (value === "true") return true;
    if (value === "false") return false;
  }

  return value;
}

function unwrapSchema(schema: z.ZodTypeAny): {
  schema: z.ZodTypeAny;
  nullable: boolean;
  optional: boolean;
} {
  let current = schema;
  let nullable = false;
  let optional = false;

  while (true) {
    if (current instanceof z.ZodNullable) {
      nullable = true;
      current = current.unwrap();
      continue;
    }

    if (current instanceof z.ZodOptional) {
      optional = true;
      current = current.unwrap();
      continue;
    }

    break;
  }

  return {
    schema: current,
    nullable,
    optional,
  };
}

export function isFieldInSchema<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  field: string,
): field is Extract<keyof T, string> {
  return field in schema.shape;
}

type ValidationTranslator = {
  has: (key: string) => boolean;
  (key: string): string;
};

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


export function mapApiValidationErrors<
  TShape extends z.ZodRawShape,
>(
  response: { errors?: unknown[] | null; message?: string },
  schema: z.ZodObject<TShape>,
  fieldTranslations: ValidationTranslator,
  genericTranslations: ValidationTranslator,
  genericMessage: string,
): {
  validationErrors?: Partial<
    Record<Extract<keyof TShape, string>, string[]>
  >;
  errorMessage?: string;
} {
  const validationErrors: Partial<
    Record<Extract<keyof TShape, string>, string[]>
  > = {};

  const unmappedMessages: string[] = [];

  for (const rawError of response.errors ?? []) {
    const error = rawError as FrontendErrorDetails;
    const field = error.field;

    const message = getTranslatedValidationMessage(
      fieldTranslations,
      genericTranslations,
      field ?? "",
      error.type ?? null,
      error.message ?? genericMessage,
    );

    if (field && isFieldInSchema(schema, field)) {
      validationErrors[field] = [
        ...(validationErrors[field] ?? []),
        message,
      ];
    } else {
      unmappedMessages.push(message);
    }
  }

  const hasFieldErrors = Object.keys(validationErrors).length > 0;

  return {
    validationErrors: hasFieldErrors
      ? validationErrors
      : undefined,
    errorMessage:
      unmappedMessages.length > 0
        ? unmappedMessages.join(" ")
        : hasFieldErrors
          ? undefined
          : response.message || genericMessage,
  };
}

export function normalizeDateValue(value: string | null): string | null {
  if (!value) {
    return value;
  }

  const parsed = dayjs(value, ["MM/DD/YYYY", "YYYY-MM-DD"], true);

  return parsed.isValid()
    ? parsed.format("YYYY-MM-DD")
    : value;
}

export function getZodValidationMessages<
  TShape extends z.ZodRawShape,
>(
  error: z.ZodError,
  validationData: Record<string, unknown>,
  schema: z.ZodObject<TShape>,
  fieldTranslations: ValidationTranslator,
  genericTranslations: ValidationTranslator,
  field?: string,
): Partial<Record<Extract<keyof TShape, string>, string[]>> {
  const validationErrors: Partial<
    Record<Extract<keyof TShape, string>, string[]>
  > = {};

  for (const issue of error.issues) {
    const issueField = issue.path[0]?.toString();

    if (!issueField || !isFieldInSchema(schema, issueField)) {
      continue;
    }

    if (field && issueField !== field) {
      continue;
    }

    const fieldSchema = schema.shape[issueField];

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

export function getZodValidationErrors<
  TShape extends z.ZodRawShape,
>(
  error: z.ZodError,
  validationData: Record<string, unknown>,
  schema: z.ZodObject<TShape>,
  fieldTranslations: ValidationTranslator,
  genericTranslations: ValidationTranslator,
  field?: string,
): Partial<Record<Extract<keyof TShape, string>, string[]>> {
  const validationErrors: Partial<
    Record<Extract<keyof TShape, string>, string[]>
  > = {};

  for (const issue of error.issues) {
    const issueField = issue.path[0]?.toString();

    if (!issueField || !isFieldInSchema(schema, issueField)) {
      continue;
    }

    // If a field was supplied, only collect errors for that field.
    if (field && issueField !== field) {
      continue;
    }

    const fieldSchema = schema.shape[issueField];

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