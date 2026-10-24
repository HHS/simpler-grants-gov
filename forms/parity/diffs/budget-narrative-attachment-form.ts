import type { FormDiff } from "../harness/model.ts";

export const DIFF: FormDiff = {
  slug: "budget-narrative-attachment-form",
  dat: {
    absentFromPlan: {
      "2-0": {
        category: "intentional",
        reason:
          "Proposed consolidation follows existing SGG 48d93f882c63a711bdec4b16e3150d1293cdff43 and the XSD Attachments/AttachedFile list (1\u2013100): the DAT mandatory first-file control and optional-more-files control become one ordered attachments array. This records the 2-0 input explicitly; no document answer is omitted. Reviewer confirmation remains open.",
      },
    },
    differingLabels: {
      "1-0": {
        category: "intentional",
        plan: "* Budget Narrative Files",
        source: "* Mandatory Budget Narrative Filename",
        reason:
          "Proposed consolidation follows existing SGG 48d93f882c63a711bdec4b16e3150d1293cdff43 and the XSD Attachments/AttachedFile list (1\u2013100): the DAT mandatory first-file control and optional-more-files control become one ordered attachments array. This records the 2-0 input explicitly; no document answer is omitted. Reviewer confirmation remains open.",
      },
    },
    differingHelp: {
      "1-0": {
        category: "intentional",
        plan: "Attach at least one file. Keep files in the order required by the agency instructions. Up to 100 files may be supplied.",
        source: "Click here to add the mandatory Budget Narrative.",
        reason:
          "Proposed consolidation follows existing SGG 48d93f882c63a711bdec4b16e3150d1293cdff43 and the XSD Attachments/AttachedFile list (1\u2013100): the DAT mandatory first-file control and optional-more-files control become one ordered attachments array. This records the 2-0 input explicitly; no document answer is omitted. Reviewer confirmation remains open.",
      },
    },
    differingRules: {
      "1-0/maxOccurs": {
        category: "intentional",
        plan: 100,
        source: 1,
        reason:
          "Proposed consolidation follows existing SGG 48d93f882c63a711bdec4b16e3150d1293cdff43 and the XSD Attachments/AttachedFile list (1\u2013100): the DAT mandatory first-file control and optional-more-files control become one ordered attachments array. This records the 2-0 input explicitly; no document answer is omitted. Reviewer confirmation remains open.",
      },
    },
  },
};
