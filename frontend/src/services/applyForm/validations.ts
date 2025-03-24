import { z } from "zod";

import { type UiSchemaSection } from "./types";

export const uiSchemaFieldSchema = z.object({
  type: z.literal("field"),
  definition: z.string(),
});

const uiSchemaSectionSchema: z.ZodSchema<UiSchemaSection> = z.lazy(() =>
  z.object({
    type: z.literal("section"),
    label: z.string(),
    name: z.string(),
    number: z.string(),
    children: z.array(z.union([uiSchemaFieldSchema, uiSchemaSectionSchema])),
  }),
);

const schemaFieldSchema = z.object({
  type: z.string(),
  title: z.string(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  format: z.string().optional(),
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