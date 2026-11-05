import type { FormDiff } from "../harness/model.ts";

export const DIFF: FormDiff = {
  slug: "other-attachments-form",
  xml: "xml-mapping",
  dat: {
    absentFromPlan: {
      "2-1": {
        category: "intentional",
        reason:
          "The existing SGG form uses one ordered list: the first file is mandatory and later files are additional attachments. The XSD allows 1\u2013100 files in that list.",
      },
    },
    differingLabels: {
      "1-0": {
        plan: "* Other Narrative Files",
        source: "* Mandatory Other Attachment Filename",
        category: "intentional",
        reason: "The form keeps the existing SGG attachment-list label.",
      },
    },
    differingHelp: {
      "1-0": {
        plan: "At least one file must be attached",
        source: 'Click here to add the mandatory "Other Attachment" file',
        category: "intentional",
        reason: "The form keeps the existing SGG help for its attachment list.",
      },
    },
    differingRules: {
      "1-0/maxOccurs": {
        plan: 100,
        source: 1,
        category: "intentional",
        reason:
          "The existing SGG form uses one ordered list: the first file is mandatory and later files are additional attachments. The XSD allows 1\u2013100 files in that list.",
      },
    },
  },
};
