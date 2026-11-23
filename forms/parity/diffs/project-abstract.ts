import type { FormDiff } from "../harness/model.ts";

export const DIFF: FormDiff = {
  slug: "project-abstract",
  xml: "xml-mapping",
  dat: {
    differingLabels: {
      "5": {
        plan: "* Project Abstract File",
        source:
          "* Please click the add attachment button to complete this entry.",
        category: "intentional",
        reason:
          "Keep the existing SGG label, which names the file the applicant needs to upload.",
      },
    },
    differingHelp: {
      "5": {
        plan: "A file must be attached.",
        source:
          "Attach a file using the appropriate buttons. This attachment is required.",
        category: "intentional",
        reason:
          "Keep the existing SGG help text. The upload control provides the button.",
      },
    },
  },
};
