import { z } from "zod";

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

export function unwrapSchema(schema: z.ZodTypeAny): {
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