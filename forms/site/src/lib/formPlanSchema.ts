import { z } from "zod";

import { undeclaredExamplePaths } from "./planExamplePaths.ts";

const widgets = z.enum([
  "TextWidget",
  "SelectWidget",
  "RadioWidget",
  "CheckboxWidget",
  "TextAreaWidget",
  "ApplicationAttachmentWidget",
  "ApplicationMultipleAttachmentWidget",
  "FieldListWidget",
  "FieldsetWidget",
  "MultiSelectWidget",
  "TableWidget",
]);

/** How many entries a repeating node allows; checked by `forms/parity`. */
const maxItems = z.union([z.number().int().positive(), z.literal("unbounded")]);

/** Metadata every node of a form plan can carry. */
const nodeBase = z.object({
  label: z.string(),
  help_text: z.string().optional(),
  dat_field: z.string().optional(),
  json_path: z.string().optional(),
  xml_path: z.string().optional(),
  widget: z.string().optional(),
  /** For a repeating node, how many entries it allows. Unset means exactly one. */
  min_items: z.number().int().nonnegative().optional(),
  max_items: maxItems.optional(),
});

const fieldNode = nodeBase.extend({
  kind: z.literal("field"),
  source_bindings: z
    .union([
      z
        .object({
          at: z.string().min(1),
          dat: z
            .array(
              z
                .object({
                  kind: z.literal("slot"),
                  path: z.string().min(1),
                  index: z.number().int().nonnegative(),
                })
                .strict(),
            )
            .min(1),
        })
        .strict(),
      z
        .object({
          dat: z
            .array(
              z
                .object({
                  kind: z.literal("choice"),
                  path: z.string().min(1),
                  value: z.string().min(1),
                })
                .strict(),
            )
            .min(1),
        })
        .strict(),
    ])
    .optional(),
  required: z.union([z.boolean(), z.string()]),
  type: z.string(),
  constraints: z.string().optional(),
  pre_populated: z.string().optional(),
  post_populated: z.string().optional(),
});

/** A group of nodes, laid out the way the form groups them. */
const sectionNode = nodeBase.extend({
  kind: z.literal("section"),
  get children(): z.ZodArray<typeof formNode> {
    return z.array(formNode);
  },
});

const formNode = z.discriminatedUnion("kind", [fieldNode, sectionNode]);

const example = z.object({
  label: z.string().min(1),
  description: z.string().min(1),
  data: z.record(z.string(), z.json()),
});

export const formSchema = z
  .object({
    title: z.string(),
    slug: z.string(),
    omb_number: z.string().optional().default(""),
    expiration_date: z.string().optional().default(""),
    fid_url: z.url().optional(),
    pdf_url: z.url().optional(),
    xsd_url: z.url().optional(),
    xsd_root: z.string().min(1).optional(),
    dat_url: z.url().optional(),
    apps_count: z.number().optional().default(0),
    status: z.enum([
      "backlog",
      "prioritized",
      "in_progress",
      "migrated",
      "ready",
    ]),
    /** Grants.gov form families, e.g. ["R&R"]; empty for forms outside any family. */
    family: z.array(z.string()).default([]),
    category: z.string().optional(),
    widgets: z.array(z.string()).optional().default([]),
    sgg_form_id: z.string().nullable().optional().default(null),
    /** Id of the compiled TypeSpec form in forms/dist/canonical/forms/, if one exists. */
    spec_id: z.string().optional(),
    /** Illustrative answers for plan review, independent of a compiled definition. */
    examples: z.array(example).optional(),
    /** Pinned existing payloads for comparison; these use the existing SGG contract. */
    existing_sgg: z
      .object({
        source_url: z.url(),
        examples: z.array(example).min(1),
      })
      .optional(),
    description: z.string().optional().default(""),
    new_concepts: z.array(widgets).optional(),
    /** The plan's top-level nodes, nested the way the form nests them. */
    children: z.array(formNode).optional().default([]),
    /**
     * Narrative context nothing verifies. Deviations from Grants.gov that can be verified are
     * recorded in `forms/parity/diffs/` instead.
     */
    notes: z.array(z.string()).optional(),
    risks: z.array(z.string()).optional(),
  })
  .superRefine((form, ctx) => {
    for (const [index, example] of (form.examples ?? []).entries()) {
      for (const path of undeclaredExamplePaths(form.children, example.data)) {
        ctx.addIssue({
          code: "custom",
          path: ["examples", index, "data"],
          message: `Example answer has no declared field path: ${path}`,
        });
      }
    }
  });

export type FormData = z.infer<typeof formSchema>;
export type FormNode = z.infer<typeof formNode>;
export type FieldNode = z.infer<typeof fieldNode>;
export type SectionNode = z.infer<typeof sectionNode>;
