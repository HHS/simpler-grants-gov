import type { FormDiff } from "../harness/model.ts";

// These entries record assessed values, not human acceptance or a source-policy waiver.
export const DIFF: FormDiff = {
  slug: "phs-398-research-plan",
  dat: {
    differingLabels: {
      "2-2": {
        category: "intentional",
        plan: "* 3. Research Strategy",
        source: "3. *Research Strategy",
        reason:
          "The library adds the required asterisk before the source-numbered label. DAT B11 places it after the number. The Research Strategy purpose and requiredness are preserved; this wording record does not change a validation rule.",
      },
    },
    differingRules: {
      "4-1/maxOccurs": {
        category: "upstream",
        plan: 10,
        source: 1,
        reason:
          "DAT F23 counts one optional Appendix group; DAT I23 names AttachmentGroupMin0Max100DataType, and Q23 explicitly allows up to 10 PDF files. The plan addresses its repeated file leaf, so maxOccurs10 records the Q23 file quantity rather than one group. No source field is omitted and no source waiver is inferred.",
      },
    },
  },
  xsd: {
    differingRules: {
      "ResearchPlanAttachments/Appendix/AttachedFile/maxOccurs": {
        category: "upstream",
        plan: 10,
        source: 100,
        reason:
          "DAT Q23 imposes up to 10 PDF files. Root XSD line97 and Attachments-V1.0.xsd line35 permit 0 through100. The definition preserves the narrower DAT business rule and XSD-compatible output; raw-XSD-valid counts11 and100 are not accepted by this capture schema. This is an assessed source-layer difference, not a human waiver or proof of complete source-policy execution.",
      },
    },
  },
};
