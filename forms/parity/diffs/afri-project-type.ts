import type { FormDiff } from "../harness/model.ts";

// Exact wording observations only; these do not waive source validation or claim acceptance.
export const DIFF: FormDiff = {
  slug: "afri-project-type",
  dat: {
    differingLabels: {
      "05": {
        category: "intentional",
        plan: "* Project Type",
        source: "Project Type",
        reason:
          "The library prepends its required asterisk. DAT B11 omits the glyph while D11/E11/F11 and Q11 require one Project Type; the requirement and source label are preserved.",
      },
      "10": {
        category: "intentional",
        plan: "* Grant Type",
        source: "Grant Type",
        reason:
          "The library prepends its required asterisk. DAT B16 omits the glyph while D16/E16/F16 and Q16 require one Grant Type; the requirement and source label are preserved.",
      },
      "16": {
        category: "intentional",
        plan: "FASE Type",
        source: null,
        reason:
          "DAT B22 is empty. C22 names FASE Options and G22 names FASEType; this readable label identifies the same source answer. K21/K22 and Q22 conditional selection/enablement remain implemented.",
      },
      "22": {
        category: "intentional",
        plan: "Strengthening Type",
        source: null,
        reason:
          "DAT B28 is empty. C28 names Strengthening Options and G28 names StrengtheningType; this readable label identifies the same source answer. K27/K28 and Q28 conditional selection/enablement remain implemented.",
      },
      "32": {
        category: "intentional",
        plan: "Other Description",
        source: null,
        reason:
          "DAT B38 is empty and C38 names Other Description. This label exposes the same source field; K38 conditional requiredness/read-only boundary and N38/O38 length0–60 remain preserved.",
      },
    },
  },
};
