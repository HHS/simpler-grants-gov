import type { FormDiff } from "../harness/model.ts";

/** The DAT requires completed values; the wire schema makes these fields optional. */
export const DIFF: FormDiff = {
  slug: "assurances-for-non-construction-programs-sf-424b-individual",
  dat: {
    differingLabels: {
      "19-0": {
        plan: "* SIGNATURE OF AUTHORIZED CERTIFYING OFFICIAL",
        source: "SIGNATURE OF AUTHORIZED CERTIFYING OFFICIAL",
        category: "upstream",
        reason:
          "The DAT marks this completion field required in its Required column but omits a star from the label. The completed-value model retains that obligation.",
      },
      "19-1": {
        plan: "* TITLE",
        source: "TITLE",
        category: "upstream",
        reason:
          "The DAT marks this completion field required in its Required column but omits a star from the label. The completed-value model retains that obligation.",
      },
      "19-2": {
        plan: "* APPLICANT NAME",
        source: "APPLICANT NAME",
        category: "upstream",
        reason:
          "The DAT marks this completion field required in its Required column but omits a star from the label. The completed-value model retains that obligation.",
      },
      "19-3": {
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
