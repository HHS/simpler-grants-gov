import type { FormDiff } from "../harness/model.ts";

export const DIFF: FormDiff = {
  slug: "phs-398-research-plan",
  xml: "xml-mapping",
  dat: {
    differingLabels: {
      "2-2": {
        plan: "* 3. Research Strategy",
        source: "3. *Research Strategy",
        category: "intentional",
        reason:
          "The renderer puts the asterisk in front of the whole label, so it appears before the number.",
      },
    },
    differingRules: {
      "4-1/maxOccurs": {
        plan: 10,
        source: 1,
        category: "intentional",
        reason:
          "The DAT counts one Appendix group. The form counts the files in that group and follows the DAT help's limit of 10 files.",
      },
    },
  },
  xsd: {
    differingRules: {
      "ResearchPlanAttachments/Appendix/AttachedFile/maxOccurs": {
        plan: 10,
        source: 100,
        category: "intentional",
        reason:
          "The form follows the DAT help's limit of 10 Appendix files. The XSD allows 100.",
      },
    },
  },
};
