import { z } from "zod";

export function getValidationTypeFromZodIssue(
  issue: z.ZodIssue,
): string | null {
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

export function validateFormWithSchema<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  data: unknown,
) {
  return schema.safeParse(data);
}
