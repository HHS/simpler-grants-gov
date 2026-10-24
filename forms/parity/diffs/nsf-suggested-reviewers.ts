import type { FormDiff } from "../harness/model.ts";
export const DIFF: FormDiff = {
  slug: "nsf-suggested-reviewers",
  dat: {
    differingLabels: {
      "4": {
        plan: "Suggested reviewers",
        source: "Enter text in the box below",
        category: "intentional",
        reason:
          "The source uses instructions or a generic box label. The control has an explicit purpose label; source instructions and help remain visible in the layout and field help.",
      },
      "6": {
        plan: "Reviewers not to include",
        source: "Enter text in the box below",
        category: "intentional",
        reason:
          "The source uses instructions or a generic box label. The control has an explicit purpose label; source instructions and help remain visible in the layout and field help.",
      },
    },
  },
};
