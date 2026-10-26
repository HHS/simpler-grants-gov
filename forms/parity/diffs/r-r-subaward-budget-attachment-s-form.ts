import type { FormDiff } from "../harness/model.ts";

// Exact observed display differences; numbered source bindings and file obligations remain.
export const DIFF: FormDiff = {
  slug: "r-r-subaward-budget-attachment-s-form",
  dat: {
    differingLabels: {
      "1-0": {
        category: "intentional",
        plan: "Subaward budget files",
        source: "1) Please attach Attachment 1",
        reason:
          "DAT row 1-0 describes ten optional numbered attachment slots. The combined optional file list retains all ten XML slot bindings and the original PDF, organization-filename and uniqueness instructions. This pins only these observed display strings; no requiredness, file-content, naming or XML-generation obligation is waived.",
      },
    },
    differingHelp: {
      "1-0": {
        category: "intentional",
        plan: "Attach up to 10 completed R&R Subaward Budget PDF files. Each file name must be unique and use the subawardee organization name.",
        source: "Click to attach Attachment 1.",
        reason:
          "DAT row 1-0 describes ten optional numbered attachment slots. The combined optional file list retains all ten XML slot bindings and the original PDF, organization-filename and uniqueness instructions. This pins only these observed display strings; no requiredness, file-content, naming or XML-generation obligation is waived.",
      },
    },
  },
};
