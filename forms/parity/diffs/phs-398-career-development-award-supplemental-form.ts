import type { FormDiff, Pinned, Recorded } from "../harness/model.ts";

const optionRow: Recorded = {
  category: "intentional",
  reason:
    "This row describes a choice within its radio group. The form captures one answer for the group.",
};

const requiredMarker: Recorded = {
  category: "intentional",
  reason:
    "The parity checker places the required marker before the whole label. The DAT puts it after the field number.",
};

const optionalDocumentHelp: Pinned = {
  plan: "Attach a PDF. Check the funding opportunity and agency instructions for whether this attachment is required and what page limit applies.",
  source:
    "Attach PDF formatted file. This attachment is required. A page limit is typically enforced for this attachment. See funding opportunity announcement and agency-specific instructions for additional guidance.",
  category: "upstream",
  reason:
    "The DAT marks this attachment optional, the PDF shows no required marker, and the XSD permits omission. The help refers applicants to the opportunity requirements.",
};

const yesNoTransform: Pinned = {
  plan: null,
  source: ["Y: Yes", "N: No"],
  category: "intentional",
  reason:
    "The response uses a boolean. XML maps it through boolean_to_yes_no to the source values.",
};

export const DIFF: FormDiff = {
  slug: "phs-398-career-development-award-supplemental-form",
  xml: "xml-mapping",
  dat: {
    absentFromPlan: {
      "9-1-1a": optionRow,
      "9-1-1b": optionRow,
      "9-2-1a": optionRow,
      "9-2-1b": optionRow,
      "9-2-1c": optionRow,
    },
    differingLabels: {
      "3-2": {
        ...requiredMarker,
        plan: "* 4. Research Strategy",
        source: "4. * Research Strategy",
      },
      "9-1-1": {
        ...requiredMarker,
        plan: "* 20. U.S. Citizen or Non-Citizen National?",
        source: "20. * U.S. Citizen or Non-Citizen National?",
      },
      "9-3": {
        plan: "Expect permanent resident status by the award start date",
        source:
          "If you are a non-U.S. citizen with a temporary visa applying for an award that requires permanent residency status, and expect to be granted a permanent resident visa by the start date of the award, check here",
        category: "intentional",
        reason:
          "Use a short checkbox label. Its help retains the temporary visa, award requirement, and timing conditions.",
      },
    },
    differingHelp: {
      "2-1": optionalDocumentHelp,
      "3-1": optionalDocumentHelp,
    },
    differingRules: {
      "8-1/maxOccurs": {
        plan: 10,
        source: 1,
        category: "intentional",
        reason:
          "The DAT counts one Appendix group. Its help limits files within that group to 10.",
      },
    },
  },
  xsd: {
    differingRules: {
      "CareerDevelopmentAwardAttachments/ResearchStrategy/attFile/required": {
        plan: "yes",
        source: "no",
        category: "upstream",
        reason:
          "The XSD permits omitting the entire attachment group. The DAT and PDF require Research Strategy on the applicant form.",
      },
      "CareerDevelopmentAwardAttachments/Appendix/AttachedFile/maxOccurs": {
        plan: 10,
        source: 100,
        category: "intentional",
        reason:
          "The form follows the DAT help's limit of 10 Appendix files. The XSD allows 100.",
      },
    },
  },
  jsonSchemaVsXsd: {
    differingRules: {
      "is_us_citizen_or_national/enum": yesNoTransform,
      "permanent_resident_by_award/enum": yesNoTransform,
    },
  },
};
