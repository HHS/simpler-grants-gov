import type { FormDiff } from "../harness/model.ts";
export const DIFF: FormDiff = {
  slug: "assurances-as-to-labor-standards",
  dat: {
    differingLabels: {
      "01-1": {
        plan: "* (Institution name)",
        source: "(Institution name)",
        category: "intentional",
        reason:
          "The library visibly marks source-required values; these DAT labels do not include an asterisk.",
      },
      "03-0": {
        plan: "* (Signature of Institutional Grants Administrator or AOR)",
        source: "(Signature of Institutional Grants Administrator or AOR)",
        category: "intentional",
        reason:
          "The library visibly marks source-required values; these DAT labels do not include an asterisk.",
      },
      "03-1": {
        plan: "* (Date)",
        source: "(Date)",
        category: "intentional",
        reason:
          "The library visibly marks source-required values; these DAT labels do not include an asterisk.",
      },
    },
  },
};
