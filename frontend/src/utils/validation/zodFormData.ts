import { normalizeDateString } from "src/utils/dateUtil";
import { z } from "zod";

type ZodObjectSchema = z.ZodObject<Record<string, ZodSchema>>;

type FormDataAdapters = Record<string, (formData: FormData) => unknown>;

export type ZodSchema = z.ZodType<unknown, z.ZodTypeDef, unknown>;

/**
 * Returns the underlying Zod object schema used for field inspection.
 *
 * Generated schemas may be wrapped in ZodEffects when `.superRefine()` is
 * added for relational/cross-field validation. Those wrappers need to remain
 * in place when validating the complete form, but need to be unwrapped when
 * inspecting individual fields.
 */
export function getZodObjectSchema(
  schema: z.ZodTypeAny,
): ZodObjectSchema | null {
  let current = schema as ZodSchema;

  while (current instanceof z.ZodEffects) {
    current = current.innerType() as ZodSchema;
  }

  return current instanceof z.ZodObject ? (current as ZodObjectSchema) : null;
}

/**
 * Converts browser FormData into an object suitable for validation against
 * a generated Zod schema.
 *
 * FormData represents most form values as strings, while the generated Zod
 * schema expects the API's actual types. The schema is used as the source of
 * truth for converting values such as numbers, booleans, nullable values,
 * and dates before validation.
 *
 * Adapters can be supplied for fields whose FormData representation cannot
 * be inferred from the Zod schema alone, such as checkbox groups.
 */
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

  // Iterate over the schema rather than FormData so missing fields are also
  // represented correctly for required/optional/nullable validation.
  for (const [fieldName, fieldSchema] of Object.entries(shape)) {
    const adapter = adapters[fieldName];

    // Explicit adapters take precedence over schema-based normalization.
    if (adapter) {
      result[fieldName] = adapter(formData);
      continue;
    }

    const rawValue = formData.get(fieldName);
    result[fieldName] = normalizeValueForSchema(rawValue, fieldSchema);
  }

  return result;
}

/**
 * Converts a raw FormData value to the type expected by a field's Zod schema.
 *
 * Invalid values are intentionally preserved where possible rather than
 * discarded so Zod can report the appropriate validation error.
 */
function normalizeValueForSchema(
  value: FormDataEntryValue | null,
  schema: ZodSchema,
): unknown {
  const { schema: unwrappedSchema, nullable } = unwrapSchema(schema);

  // FormData.get() returns null when a field is absent. Preserve the
  // distinction between an absent nullable field and an absent required or
  // optional field so Zod can apply the schema's own rules.
  if (value === null) {
    if (nullable) {
      return null;
    }

    return undefined;
  }

  // File values and any future non-string FormData values should be left
  // untouched rather than coerced as strings.
  if (typeof value !== "string") {
    return value;
  }

  // Empty nullable fields map to null. Empty non-nullable strings are
  // preserved so Zod can determine whether the value is valid.
  if (value === "") {
    if (nullable) {
      return null;
    }

    return "";
  }

  if (unwrappedSchema instanceof z.ZodNumber) {
    // Form inputs may contain display formatting that is not part of the
    // numeric value expected by the API.
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

  if (unwrappedSchema instanceof z.ZodString) {
    const isDate = unwrappedSchema._def.checks.some(
      (check) => check.kind === "date",
    );

    if (isDate) {
      // Keep the original value when normalization fails so Zod sees the
      // invalid input and can produce the expected date validation error.
      return normalizeDateString(value) ?? value;
    }
  }

  return value;
}

/**
 * Removes nullable/optional wrappers so callers can inspect the underlying
 * field type while retaining whether those wrappers were present.
 *
 * The flags are used when converting missing and empty FormData values.
 */
export function unwrapSchema(schema: ZodSchema): {
  schema: ZodSchema;
  nullable: boolean;
  optional: boolean;
} {
  let current = schema;
  let nullable = false;
  let optional = false;

  // Nullable and optional wrappers may be nested in either order, so continue
  // unwrapping until the underlying field schema is reached.
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

/**
 * Returns a field's schema from a generated object schema, including schemas
 * wrapped in ZodEffects for relational validation.
 */
export function getFieldSchema(
  schema: z.ZodTypeAny,
  field: string,
): ZodSchema | undefined {
  const objectSchema = getZodObjectSchema(schema);

  return objectSchema?.shape[field];
}

/**
 * Checks whether a field belongs to the generated object schema.
 *
 * Besides being a runtime guard, the type predicate lets callers safely use
 * dynamically obtained field names with schema-backed validation code.
 */
export function isFieldInSchema<TField extends string>(
  schema: z.ZodTypeAny,
  field: string,
): field is TField {
  const objectSchema = getZodObjectSchema(schema);

  return !!objectSchema && field in objectSchema.shape;
}
