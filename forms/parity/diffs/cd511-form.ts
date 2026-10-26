import type { FormDiff } from "../harness/model.ts";

export const DIFF: FormDiff = {
  slug: "cd511-form",
  dat: {
    differingLabels: {
      "02-02": {
        category: "intentional",
        plan: "AWARD NUMBER",
        source: "* AWARD NUMBER",
        reason:
          "The printed DAT asterisk does not mean both references are mandatory. DAT Required? is No for each and its business rules require at least one; both are allowed, with a separate executed model-level OR rule.",
      },
      "02-03": {
        category: "intentional",
        plan: "PROJECT NAME",
        source: "* PROJECT NAME",
        reason:
          "The printed DAT asterisk does not mean both references are mandatory. DAT Required? is No for each and its business rules require at least one; both are allowed, with a separate executed model-level OR rule.",
      },
    },
  },
  xsd: {
    differingRules: {
      "ProjectName/minLength": {
        category: "intentional",
        plan: 1,
        source: 0,
        reason:
          "Original XSD allows supplied-empty ProjectName; current SGG requires a nonempty supplied value. Preserve the scoped existing-SGG draft compatibility profile with the proposed cd511-source-policy decision visible, not source-policy acceptance.",
      },
      "ContactName/FirstName/required": {
        category: "intentional",
        plan: "yes",
        source: "no",
        reason:
          "DAT and current SGG require first/last contact names; original XSD makes ContactName optional. This is the explicit compatibility profile and proposed source-policy question, not a new Person variant.",
      },
      "ContactName/LastName/required": {
        category: "intentional",
        plan: "yes",
        source: "no",
        reason:
          "DAT and current SGG require first/last contact names; original XSD makes ContactName optional. This is the explicit compatibility profile and proposed source-policy question, not a new Person variant.",
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
      applicant_name: {
        category: "intentional",
        plan: "Enter legal name of applicant, which will undertake the assistance activity.",
        source: "Enter the legal name of the organization.",
        reason:
          "The existing bank part supplies the electronic-draft instruction rather than claiming source cover copying or hard-copy signing occurred. The complete original DAT help and population ownership remain in this plan; current policy decisions remain proposed.",
      },
      "contact_person.prefix": {
        category: "intentional",
        plan: "Select the Prefix from the provided list or enter a new Prefix not provided on the list.",
        source: "Enter the prefix.",
        reason:
          "The existing bank part supplies the electronic-draft instruction rather than claiming source cover copying or hard-copy signing occurred. The complete original DAT help and population ownership remain in this plan; current policy decisions remain proposed.",
      },
      "contact_person.first_name": {
        category: "intentional",
        plan: "Enter the First Name. This field is required.",
        source: "Enter the first name.",
        reason:
          "The existing bank part supplies the electronic-draft instruction rather than claiming source cover copying or hard-copy signing occurred. The complete original DAT help and population ownership remain in this plan; current policy decisions remain proposed.",
      },
      "contact_person.last_name": {
        category: "intentional",
        plan: "Enter the Last Name. This field is required.",
        source: "Enter the last name.",
        reason:
          "The existing bank part supplies the electronic-draft instruction rather than claiming source cover copying or hard-copy signing occurred. The complete original DAT help and population ownership remain in this plan; current policy decisions remain proposed.",
      },
      "contact_person.suffix": {
        category: "intentional",
        plan: "Select the Suffix from the provided list or enter a new Suffix not provided on the list.",
        source: "Enter the suffix.",
        reason:
          "The existing bank part supplies the electronic-draft instruction rather than claiming source cover copying or hard-copy signing occurred. The complete original DAT help and population ownership remain in this plan; current policy decisions remain proposed.",
      },
      contact_person_title: {
        category: "intentional",
        plan: "Enter in the Position Title.",
        source: "Enter the position title.",
        reason:
          "The existing bank part supplies the electronic-draft instruction rather than claiming source cover copying or hard-copy signing occurred. The complete original DAT help and population ownership remain in this plan; current policy decisions remain proposed.",
      },
      signature: {
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
      "signature/required": {
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
