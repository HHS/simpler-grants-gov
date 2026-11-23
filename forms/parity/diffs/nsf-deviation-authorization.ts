import type { FormDiff } from "../harness/model.ts";

export const DIFF: FormDiff = {
  slug: "nsf-deviation-authorization",
  xml: "xml-mapping",
  dat: {
    differingLabels: {
      "3": {
        plan: "Deviation authorization information",
        source:
          "Enter text for the Deviation Authorization information in the box below (if applicable)",
        category: "intentional",
        reason:
          "The DAT prompt is the section help; the field uses a short label.",
      },
    },
  },
};
