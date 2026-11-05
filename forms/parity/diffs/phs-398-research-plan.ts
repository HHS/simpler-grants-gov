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
          "The required marker precedes the whole label in the shared renderer.",
      },
    },
    differingRules: {
      "4-1/maxOccurs": {
        plan: 10,
        source: 1,
        category: "upstream",
        reason:
          "The DAT counts one Appendix group, while its help permits ten files and the XSD permits up to 100. The plan counts files and follows the DAT help.",
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
          "The plan follows the DAT help's narrower ten-file Appendix business rule.",
      },
    },
  },
};
