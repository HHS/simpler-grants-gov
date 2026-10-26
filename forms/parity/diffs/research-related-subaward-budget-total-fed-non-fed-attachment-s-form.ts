import type { FormDiff } from "../harness/model.ts";

// Exact display values and one unresolved source-file facet; no blanket exceptions.
export const DIFF: FormDiff = {
  slug: "research-related-subaward-budget-total-fed-non-fed-attachment-s-form",
  dat: {
    differingLabels: {
      "1-0": {
        category: "intentional",
        plan: "Subaward budget files",
        source: "1) Please attach Attachment 1",
        reason:
          "DAT row 1-0 describes ten optional source attachment slots. The combined ordered list retains all ten explicit ATT slot bindings and the full original source instructions, PDF/template requirements and organization-filename/uniqueness guidance. This pins only the observed display strings; it does not waive file-content, naming or generated-budget obligations.",
      },
    },
    differingHelp: {
      "1-0": {
        category: "intentional",
        plan: "Attach up to 10 completed R&R Subaward Budget (Fed/Non-Fed) PDF files. Each file name must be unique and use the subawardee organization name.",
        source: "Click to attach Attachment 1.",
        reason:
          "DAT row 1-0 describes ten optional source attachment slots. The combined ordered list retains all ten explicit ATT slot bindings and the full original source instructions, PDF/template requirements and organization-filename/uniqueness guidance. This pins only the observed display strings; it does not waive file-content, naming or generated-budget obligations.",
      },
    },
    differingRules: {
      "1-0/maxLength": {
        category: "intentional",
        plan: null,
        source: 30,
        reason:
          'The DAT FILE/Single_File row states 30 in its maximum characters/value column and says "Invalid R&R Subaward Attachment filename." Its business rules concern filename naming. The source ATT1–ATT10 XSD elements are unrestricted xs:string; the imported generic AttachedFileDataType.FileName permits 1–255 characters. The source artifacts do not explicitly resolve whether this DAT value is a filename limit or how it is enforced. The definition captures an existing-library UUID reference, not the filename or PDF bytes, so applying maxLength 30 to that UUID would invalidate valid references and invent equivalence. The exact 30-versus-unstated observation remains visible as an unresolved source/upload interpretation for review and actual metadata/content integration. No filename policy is accepted, no source obligation is waived, and no filename validation or full production parity is claimed.',
      },
    },
  },
};
