import type { FormDiff, Pinned } from "../harness/model.ts";

const requiredLabel = (label: string): Pinned => ({
  plan: `* ${label}`,
  source: label,
  category: "intentional",
  reason:
    "The plan marks the required field with an asterisk. The DAT puts requiredness in its own column.",
});

export const DIFF: FormDiff = {
  slug: "project-abstract-summary",
  xml: "xml-mapping",
  dat: {
    differingLabels: {
      "01-0": requiredLabel("Funding Opportunity Number"),
      "03-0": requiredLabel("Applicant Name"),
      "04-0": requiredLabel("Descriptive Title of Applicant's Project"),
      "05-0": requiredLabel("Project Abstract"),
    },
    differingHelp: {
      "01-0": {
        plan: "SGG fills this from the selected funding opportunity.",
        source:
          "Funding Opportunity Number for the particular program announcement. Pre-populated from the Application cover sheet. This field is required.",
        category: "intentional",
        reason:
          "Existing SGG fills this from application context. The help describes the source the applicant sees in SGG.",
      },
      "02-0": {
        plan: "SGG fills this when the competition or opportunity supplies an assistance listing.",
        source:
          "Assistance Listing Number assigned to the Program. Pre-populated from the Application cover sheet.",
        category: "intentional",
        reason:
          "Existing SGG fills this from application context. The help describes the source the applicant sees in SGG.",
      },
    },
  },
};
