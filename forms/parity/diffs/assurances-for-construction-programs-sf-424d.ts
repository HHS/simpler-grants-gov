import type { FormDiff } from "../harness/model.ts";

export const DIFF: FormDiff = {
  slug: "assurances-for-construction-programs-sf-424d",
  dat: {
    differingLabels: {
      "20-0": {
        category: "intentional",
        plan: "* SIGNATURE OF AUTHORIZED CERTIFYING OFFICIAL",
        source: "SIGNATURE OF AUTHORIZED CERTIFYING OFFICIAL",
        reason:
          "The plan displays the DAT-required completion field with the existing required asterisk. The source field label has no asterisk; DAT Required? is Yes. Draft signature/date requiredness is compared separately.",
      },
      "21-0": {
        category: "intentional",
        plan: "* TITLE",
        source: "TITLE",
        reason:
          "The plan displays the DAT-required completion field with the existing required asterisk. The source field label has no asterisk; DAT Required? is Yes. Draft signature/date requiredness is compared separately.",
      },
      "22-0": {
        category: "intentional",
        plan: "* APPLICANT ORGANIZATION",
        source: "APPLICANT ORGANIZATION",
        reason:
          "The plan displays the DAT-required completion field with the existing required asterisk. The source field label has no asterisk; DAT Required? is Yes. Draft signature/date requiredness is compared separately.",
      },
      "23-0": {
        category: "intentional",
        plan: "* DATE SUBMITTED",
        source: "DATE SUBMITTED",
        reason:
          "The plan displays the DAT-required completion field with the existing required asterisk. The source field label has no asterisk; DAT Required? is Yes. Draft signature/date requiredness is compared separately.",
      },
    },
  },
  xsd: {
    differingRules: {
      "AuthorizedRepresentative/RepresentativeName/required": {
        category: "upstream",
        plan: "yes",
        source: "no",
        reason:
          "The DAT describes this field as required at form completion; the original XSD makes the answer element optional. These source layers are preserved separately. Existing SGG applicant drafts require title and organization, with signature/date supplied later; this does not assert XSD transmission requiredness.",
      },
      "AuthorizedRepresentative/RepresentativeTitle/required": {
        category: "upstream",
        plan: "yes",
        source: "no",
        reason:
          "The DAT describes this field as required at form completion; the original XSD makes the answer element optional. These source layers are preserved separately. Existing SGG applicant drafts require title and organization, with signature/date supplied later; this does not assert XSD transmission requiredness.",
      },
      "ApplicantOrganizationName/required": {
        category: "upstream",
        plan: "yes",
        source: "no",
        reason:
          "The DAT describes this field as required at form completion; the original XSD makes the answer element optional. These source layers are preserved separately. Existing SGG applicant drafts require title and organization, with signature/date supplied later; this does not assert XSD transmission requiredness.",
      },
      "SubmittedDate/required": {
        category: "upstream",
        plan: "yes",
        source: "no",
        reason:
          "The DAT describes this field as required at form completion; the original XSD makes the answer element optional. These source layers are preserved separately. Existing SGG applicant drafts require title and organization, with signature/date supplied later; this does not assert XSD transmission requiredness.",
      },
    },
  },
  jsonSchema: {
    differingRules: {
      "signature/required": {
        category: "intentional",
        plan: "yes",
        source: "no",
        reason:
          "The plan states DAT completion requiredness; this definition is the existing SGG applicant-draft profile. Submission-owned signature/date may be absent and become readonly context when supplied. This is not application postpopulation, signing, source-policy approval or production acceptance.",
      },
      "date_signed/required": {
        category: "intentional",
        plan: "yes",
        source: "no",
        reason:
          "The plan states DAT completion requiredness; this definition is the existing SGG applicant-draft profile. Submission-owned signature/date may be absent and become readonly context when supplied. This is not application postpopulation, signing, source-policy approval or production acceptance.",
      },
    },
  },
};
