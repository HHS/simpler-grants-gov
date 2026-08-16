import { z } from "zod";

type ZodObjectSchema = z.ZodObject<Record<string, ZodSchema>>;

type FormDataAdapters = Record<string, (formData: FormData) => unknown>;

export type ZodSchema = z.ZodType<unknown, z.ZodTypeDef, unknown>;

export function getZodObjectSchema(
  schema: z.ZodTypeAny,
): ZodObjectSchema | null {
  let current = schema as ZodSchema;

  while (current instanceof z.ZodEffects) {
    current = current.innerType() as ZodSchema;
  }

  return current instanceof z.ZodObject ? (current as ZodObjectSchema) : null;
}

export function formDataToZodInput(
  formData: FormData,
  schema: z.ZodTypeAny,
  adapters: FormDataAdapters = {},
) {
  const result: Record<string, unknown> = {};
  const objectSchema = getZodObjectSchema(schema);

  if (!objectSchema) {
    throw new Error("Expected a Zod object schema");
  }

  const shape = objectSchema.shape;

  for (const [fieldName, fieldSchema] of Object.entries(shape)) {
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
  schema: ZodSchema,
): unknown {
  const { schema: unwrappedSchema, nullable } = unwrapSchema(schema);

  if (value === null) {
    if (nullable) {
      return null;
    }

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
    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }
  }

  return value;
}

export function unwrapSchema(schema: ZodSchema): {
  schema: ZodSchema;
  nullable: boolean;
  optional: boolean;
} {
  let current = schema;
  let nullable = false;
  let optional = false;

  while (true) {
    if (current instanceof z.ZodNullable) {
      nullable = true;
      current = current.unwrap() as ZodSchema;
      continue;
    }

    if (current instanceof z.ZodOptional) {
      optional = true;
      current = current.unwrap() as ZodSchema;
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

export function getFieldSchema(
  schema: z.ZodTypeAny,
  field: string,
): ZodSchema | undefined {
  const objectSchema = getZodObjectSchema(schema);

  return objectSchema?.shape[field];
}

export function isFieldInSchema<TField extends string>(
  schema: z.ZodTypeAny,
  field: string,
): field is TField {
  const objectSchema = getZodObjectSchema(schema);

  return !!objectSchema && field in objectSchema.shape;
}
