import type { FormDiff } from "../harness/model.ts";

// Assessed source-layer values, not human acceptance or a source-policy waiver.
export const DIFF: FormDiff = {
  slug: "phs-398-research-training-program-plan",
  dat: {
    differingLabels: {
      "2-1": {
        category: "intentional",
        plan: "* 2. Program Plan",
        source: "2. * Program Plan",
        reason:
          "The library places its required asterisk before the source-numbered label; DAT B10 places it after the number. Program Plan purpose and requiredness are preserved, with no validation change.",
      },
    },
    differingRules: {
      "5-1/maxOccurs": {
        category: "upstream",
        plan: 10,
        source: 1,
        reason:
          "DAT F25 counts one optional Appendix group, I25 names AttachmentGroupMin0Max100DataType, and K25/Q25 cap its repeated PDF files at10. The plan addresses the repeated file leaf, so maxOccurs10 records the business file quantity rather than one group. No source field is omitted or source waiver inferred.",
      },
    },
  },
  xsd: {
    differingRules: {
      "ResearchTrainingProgramPlanAttachments/Appendix/AttachedFile/maxOccurs":
        {
          category: "upstream",
          plan: 10,
          source: 100,
          reason:
            "DAT K25/Q25 limit Appendix to10 PDFs. Root XSD line103 and Attachments-V1.0.xsd line35 permit0..100. The definition preserves the narrower DAT business rule and XSD-compatible accepted output; raw-XSD-valid counts11/100 are refused by the applicant schema. This is an assessed source-layer difference, not a waiver or proof of complete external-context execution.",
        },
    },
  },
};
