import type { FormDiff } from "../harness/model.ts";

export const DIFF: FormDiff = {
  slug: "phs-398-research-training-program-plan",
  xml: "xml-mapping",
  dat: {
    differingLabels: {
      "2-4": {
        plan: "5. Multiple PD/PI Leadership Plan",
        source: "5. Multiple PD/PI Leadership Plan (if applicable)",
        category: "intentional",
        reason:
          "The shared label omits the optional qualifier. The upload remains optional.",
      },
      "2-1": {
        plan: "* 2. Program Plan",
        source: "2. * Program Plan",
        category: "intentional",
        reason:
          "The parity checker prefixes required labels with an asterisk. The DAT puts the asterisk after the field number.",
      },
    },
    differingRules: {
      "5-1/maxOccurs": {
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
      "ResearchTrainingProgramPlanAttachments/Appendix/AttachedFile/maxOccurs":
        {
          plan: 10,
          source: 100,
          category: "intentional",
          reason:
            "The form follows the DAT help's limit of 10 Appendix files. The XSD allows 100.",
        },
    },
  },
};
