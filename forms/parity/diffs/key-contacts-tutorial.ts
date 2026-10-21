import type { FormDiff, Pinned } from "../harness/model.ts";
import { BANK_WORDING } from "./common.ts";

/** The DAT stars State and Zip / Postal Code, but its Required column and the XSD make them optional. */
const conditionalStar = (label: string): Pinned => ({
  plan: label,
  source: `* ${label}`,
  category: "upstream",
  reason:
    "The DAT stars State and Zip / Postal Code but marks them not required, and the XSD makes them optional. Its help text requires them only when Country is the United States, so the plan treats them as conditional.",
});

export const DIFF: FormDiff = {
  slug: "key-contacts-tutorial",
  // Step 5: the contact fields come from the question bank's Person, so the plan uses its wording.
  wording: BANK_WORDING,
  dat: {
    differingLabels: {
      "7-14": conditionalStar("State"),
      "7-17": conditionalStar("Zip / Postal Code"),
    },
  },
};
