import type { FormDiff } from "../harness/model.ts";

export const DIFF: FormDiff = {
  slug: "nsf-suggested-reviewers",
  xml: "xml-mapping",
  dat: {
    differingLabels: {
      "4": {
        plan: "Suggested reviewers",
        source: "Enter text in the box below",
        category: "intentional",
        reason:
          "The label uses the reviewer purpose from DAT heading 3; the field retains the DAT help.",
      },
      "6": {
        plan: "Reviewers not to include",
        source: "Enter text in the box below",
        category: "intentional",
        reason:
          "The label uses the reviewer purpose from DAT heading 5; the field retains the DAT help.",
      },
    },
  },
};
