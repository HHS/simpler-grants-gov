import type { FormDiff } from "../harness/model.ts";

export const DIFF: FormDiff = {
  slug: "project-abstract-summary",
  dat: {
    differingLabels: {
      "01-0": {
        category: "upstream",
        plan: "* Funding Opportunity Number",
        source: "Funding Opportunity Number",
        reason:
          "DAT Required? and help require this answer but the printed label has no asterisk. The plan states requiredness, agreeing with the XSD and existing SGG; no new validation policy is introduced.",
      },
      "03-0": {
        category: "upstream",
        plan: "* Applicant Name",
        source: "Applicant Name",
        reason:
          "DAT Required? and help require this answer but the printed label has no asterisk. The plan states requiredness, agreeing with the XSD and existing SGG; no new validation policy is introduced.",
      },
      "04-0": {
        category: "upstream",
        plan: "* Descriptive Title of Applicant's Project",
        source: "Descriptive Title of Applicant's Project",
        reason:
          "DAT Required? and help require this answer but the printed label has no asterisk. The plan states requiredness, agreeing with the XSD and existing SGG; no new validation policy is introduced.",
      },
      "05-0": {
        category: "upstream",
        plan: "* Project Abstract",
        source: "Project Abstract",
        reason:
          "DAT Required? and help require this answer but the printed label has no asterisk. The plan states requiredness, agreeing with the XSD and existing SGG; no new validation policy is introduced.",
      },
    },
  },
};
