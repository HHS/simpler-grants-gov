import type { FormDiff } from "../harness/model.ts";

// Exact observed display strings; finite source slots and file obligations remain.
export const DIFF: FormDiff = {
  slug: "r-r-subaward-budget-attachment-s-form-5-yr-30-att",
  dat: {
    differingLabels: {
      "1-0": {
        category: "intentional",
        plan: "Subaward budget files",
        source: "1) Please attach Attachment 1",
        reason:
          "DAT row 1-0 describes 30 optional numbered source attachment slots. The combined ordered list retains all 30 explicit ATT slot bindings and the full original source instructions, PDF/template requirements and organization-filename/uniqueness guidance. This pins only the observed display strings; no requiredness, file-content, naming or generated-budget payload obligation is waived.",
      },
    },
    differingHelp: {
      "1-0": {
        category: "intentional",
        plan: "Attach up to 30 completed R&R Subaward Budget PDF files. Each file name must be unique and use the subawardee organization name.",
        source: "Click to attach Attachment 1.",
        reason:
          "DAT row 1-0 describes 30 optional numbered source attachment slots. The combined ordered list retains all 30 explicit ATT slot bindings and the full original source instructions, PDF/template requirements and organization-filename/uniqueness guidance. This pins only the observed display strings; no requiredness, file-content, naming or generated-budget payload obligation is waived.",
      },
    },
  },
};
