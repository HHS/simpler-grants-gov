import type { FormDiff } from "../harness/model.ts";

export const DIFF: FormDiff = {
  slug: "grants-gov-lobbying-form",
  jsonSchema: {
    differingRules: {
      "authorized_representative_signature/required": {
        category: "intentional",
        plan: "yes",
        source: "no",
        reason:
          "The source plan describes completion and source population. This candidate deliberately preserves the existing SGG electronic applicant-draft contract: editable manual fallback and optional readonly submission context. Source-policy, copying/signing and production acceptance remain separate; the proposed decision is not accepted by this definition.",
      },
      "submitted_date/required": {
        category: "intentional",
        plan: "yes",
        source: "no",
        reason:
          "The source plan describes completion and source population. This candidate deliberately preserves the existing SGG electronic applicant-draft contract: editable manual fallback and optional readonly submission context. Source-policy, copying/signing and production acceptance remain separate; the proposed decision is not accepted by this definition.",
      },
    },
  },
  uiSchema: {
    differingHelp: {
      organization_name: {
        category: "intentional",
        plan: "Pre-populated from the SF 424. This is the legal name of the organization that will undertake the assistance activity. This should normally be the name under which the organization has registered with the Business Partner Network.",
        source: "Enter the legal name of the organization.",
        reason:
          "The existing bank part supplies the electronic-draft instruction rather than claiming source cover copying or hard-copy signing occurred. The complete original DAT help and population ownership remain in this plan; current policy decisions remain proposed.",
      },
      "authorized_representative_name.prefix": {
        category: "intentional",
        plan: "Pre-populated from the SF 424. This is the prefix (e.g., Mr., Mrs., Rev.) for the name of the Authorized Representative.",
        source: "Enter the prefix.",
        reason:
          "The existing bank part supplies the electronic-draft instruction rather than claiming source cover copying or hard-copy signing occurred. The complete original DAT help and population ownership remain in this plan; current policy decisions remain proposed.",
      },
      "authorized_representative_name.first_name": {
        category: "intentional",
        plan: "Pre-populated from the SF 424. This is the first (given) name of the Authorized Representative who is signing this form.",
        source: "Enter the first name.",
        reason:
          "The existing bank part supplies the electronic-draft instruction rather than claiming source cover copying or hard-copy signing occurred. The complete original DAT help and population ownership remain in this plan; current policy decisions remain proposed.",
      },
      "authorized_representative_name.middle_name": {
        category: "intentional",
        plan: "Pre-populated from the SF 424. This is the middle name of the Authorized Representative.",
        source: "Enter the middle name.",
        reason:
          "The existing bank part supplies the electronic-draft instruction rather than claiming source cover copying or hard-copy signing occurred. The complete original DAT help and population ownership remain in this plan; current policy decisions remain proposed.",
      },
      "authorized_representative_name.last_name": {
        category: "intentional",
        plan: "Pre-populated from the SF 424. This is the last (family) name of the Authorized Representative signing this form.",
        source: "Enter the last name.",
        reason:
          "The existing bank part supplies the electronic-draft instruction rather than claiming source cover copying or hard-copy signing occurred. The complete original DAT help and population ownership remain in this plan; current policy decisions remain proposed.",
      },
      "authorized_representative_name.suffix": {
        category: "intentional",
        plan: "Pre-populated from the SF 424. This is the suffix (e.g., Jr, Sr, PhD) for the name of the Authorized Representative.",
        source: "Enter the suffix.",
        reason:
          "The existing bank part supplies the electronic-draft instruction rather than claiming source cover copying or hard-copy signing occurred. The complete original DAT help and population ownership remain in this plan; current policy decisions remain proposed.",
      },
      authorized_representative_title: {
        category: "intentional",
        plan: "Pre-populated from the SF 424. This is the title of the Authorized Representative who is signing this form.",
        source: "Enter the position title.",
        reason:
          "The existing bank part supplies the electronic-draft instruction rather than claiming source cover copying or hard-copy signing occurred. The complete original DAT help and population ownership remain in this plan; current policy decisions remain proposed.",
      },
      authorized_representative_signature: {
        category: "intentional",
        plan: "It is the organization's responsibility to assure that only properly authorized individuals sign in this capacity and/or submit the application to Grants.gov. If this application is submitted through Grants.gov leave blank. If a hard copy is submitted, the AOR must sign this block.",
        source: "Completed on submission to Grants.gov.",
        reason:
          "The existing bank part supplies the electronic-draft instruction rather than claiming source cover copying or hard-copy signing occurred. The complete original DAT help and population ownership remain in this plan; current policy decisions remain proposed.",
      },
      submitted_date: {
        category: "intentional",
        plan: "If this application is submitted through Grants.gov, the system will generate this date. If submitting a hard copy, enter the date the AOR signed the application.",
        source: "Completed on submission to Grants.gov.",
        reason:
          "The existing bank part supplies the electronic-draft instruction rather than claiming source cover copying or hard-copy signing occurred. The complete original DAT help and population ownership remain in this plan; current policy decisions remain proposed.",
      },
    },
  },
  jsonSchemaVsXsd: {
    differingRules: {
      "authorized_representative_signature/required": {
        category: "intentional",
        plan: "no",
        source: "yes",
        reason:
          "The original XSD requires this value in the transmitted representation; the unchanged existing SGG applicant-draft contract allows it to be absent and supplies it through submission post-population. This definition keeps that scoped electronic draft behavior with readonly context when supplied. Full source-XML validation is tested only with explicit completion values; this is not signing, source-policy acceptance or production lifecycle proof.",
      },
      "submitted_date/required": {
        category: "intentional",
        plan: "no",
        source: "yes",
        reason:
          "The original XSD requires this value in the transmitted representation; the unchanged existing SGG applicant-draft contract allows it to be absent and supplies it through submission post-population. This definition keeps that scoped electronic draft behavior with readonly context when supplied. Full source-XML validation is tested only with explicit completion values; this is not signing, source-policy acceptance or production lifecycle proof.",
      },
    },
  },
};
