import { z } from "zod";

import { type UiSchemaSection } from "./types";

export const uiSchemaFieldSchema = z.object({
  type: z.literal("field"),
  definition: z.custom<`/properties/${string}`>(
    (val) => typeof val === "string" && val.startsWith("/properties/"),
  ),
});

const uiSchemaSectionSchema: z.ZodSchema<UiSchemaSection> = z.lazy(() =>
  z.object({
    type: z.literal("section"),
    label: z.string(),
    name: z.string(),
    number: z.string().optional(),
    children: z.array(z.union([uiSchemaFieldSchema, uiSchemaSectionSchema])),
  }),
);

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
  title: z.string(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  format: z.string().optional(),
  pattern: z.string().optional(),
});

export const formSchemaValidate = z.object({
  title: z.string(),
  description: z.string().optional(),
  properties: z.record(schemaFieldSchema),
  required: z.array(z.string()).optional(),
});

export const uiSchemaValidate = z.union([
  z.union([uiSchemaFieldSchema, uiSchemaSectionSchema]),
  z.array(z.union([uiSchemaFieldSchema, uiSchemaSectionSchema])),
]);
