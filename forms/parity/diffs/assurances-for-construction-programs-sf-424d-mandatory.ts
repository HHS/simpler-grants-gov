import type { FormDiff } from "../harness/model.ts";

/** The DAT requires completed values; the wire schema makes these fields optional. */
export const DIFF: FormDiff = {
  slug: "assurances-for-construction-programs-sf-424d-mandatory",
  dat: {
    differingLabels: {
      "20-0": {
        plan: "* SIGNATURE OF AUTHORIZED CERTIFYING OFFICIAL",
        source: "SIGNATURE OF AUTHORIZED CERTIFYING OFFICIAL",
        category: "upstream",
        reason:
          "The DAT marks this completion field required in its Required column but omits a star from the label. The completed-value model retains that obligation.",
      },
      "21-0": {
        plan: "* TITLE",
        source: "TITLE",
        category: "upstream",
        reason:
          "The DAT marks this completion field required in its Required column but omits a star from the label. The completed-value model retains that obligation.",
      },
      "22-0": {
        plan: "* APPLICANT ORGANIZATION",
        source: "APPLICANT ORGANIZATION",
        category: "upstream",
        reason:
          "The DAT marks this completion field required in its Required column but omits a star from the label. The completed-value model retains that obligation.",
      },
      "23-0": {
        plan: "* DATE SUBMITTED",
        source: "DATE SUBMITTED",
        category: "upstream",
        reason:
          "The DAT marks this completion field required in its Required column but omits a star from the label. The completed-value model retains that obligation.",
      },
    },
  },
  xsd: {
    differingRules: {
      "AuthorizedRepresentative/RepresentativeName/required": {
        plan: "yes",
        source: "no",
        category: "upstream",
        reason:
          "The DAT requires this completed-form value. The XSD makes it optional. The model retains the DAT obligation; signing/prefill values are explicit context fixtures rather than applicant-entered substitutes.",
      },
      "AuthorizedRepresentative/RepresentativeTitle/required": {
        plan: "yes",
        source: "no",
        category: "upstream",
        reason:
          "The DAT requires this completed-form value. The XSD makes it optional. The model retains the DAT obligation; signing/prefill values are explicit context fixtures rather than applicant-entered substitutes.",
      },
      "ApplicantOrganizationName/required": {
        plan: "yes",
        source: "no",
        category: "upstream",
        reason:
          "The DAT requires this completed-form value. The XSD makes it optional. The model retains the DAT obligation; signing/prefill values are explicit context fixtures rather than applicant-entered substitutes.",
      },
      "SubmittedDate/required": {
        plan: "yes",
        source: "no",
        category: "upstream",
        reason:
          "The DAT requires this completed-form value. The XSD makes it optional. The model retains the DAT obligation; signing/prefill values are explicit context fixtures rather than applicant-entered substitutes.",
      },
    },
  },
};
