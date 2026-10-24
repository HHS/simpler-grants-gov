import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

import { formSchema } from "./lib/formPlanSchema.ts";

export const TOTAL_APPS = 4_072_033;
export type {
  FormData,
  FormNode,
  FieldNode,
  SectionNode,
} from "./lib/formPlanSchema.ts";

export const collections = {
  forms: defineCollection({
    loader: glob({ pattern: "**/*.json", base: "./src/content/forms" }),
    schema: formSchema,
  }),
};
