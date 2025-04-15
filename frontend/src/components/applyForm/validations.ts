import { z } from "zod";

const schemaFieldSchema = z.object({
  type: z.enum([
    "string",
    "number",
    "array",
    "object",
    "boolean",
    "null",
    "integer",
  ]),
  title: z.string().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  format: z.string().optional(),
  pattern: z.string().optional(),
});

export const uiSchemaFieldSchema = z.object({
  type: z.literal("field"),
  definition: z
    .custom<`/properties/${string}`>((val) => typeof val === "string" && val.startsWith("/properties/"))
    .optional(),
  schema: schemaFieldSchema.optional(),
});

export const formSchemaValidate = z.object({
  title: z.string(),
  description: z.string().optional(),
  properties: z.record(schemaFieldSchema).optional(),
  required: z.array(z.string()).optional(),
});
