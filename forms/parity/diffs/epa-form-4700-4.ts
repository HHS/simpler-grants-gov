import type { FormDiff } from "../harness/model.ts";

export const DIFF: FormDiff = {
  slug: "epa-form-4700-4",
  jsonSchema: {
    differingRules: {
      "civil_rights_lawsuit_question1/minLength": {
        category: "intentional",
        plan: 0,
        source: 1,
        reason:
          "Original DAT/XSD allow supplied-empty optional narrative, while existing SGG requires nonempty when supplied. This definition preserves the installed profile and exposes pending source-policy review, not a new waiver.",
      },
      "civil_rights_lawsuit_question2/minLength": {
        category: "intentional",
        plan: 0,
        source: 1,
        reason:
          "Original DAT/XSD allow supplied-empty optional narrative, while existing SGG requires nonempty when supplied. This definition preserves the installed profile and exposes pending source-policy review, not a new waiver.",
      },
      "civil_rights_lawsuit_question3/minLength": {
        category: "intentional",
        plan: 0,
        source: 1,
        reason:
          "Original DAT/XSD allow supplied-empty optional narrative, while existing SGG requires nonempty when supplied. This definition preserves the installed profile and exposes pending source-policy review, not a new waiver.",
      },
      "construction_new_facilities_explanation/minLength": {
        category: "intentional",
        plan: 0,
        source: 1,
        reason:
          "Original DAT/XSD allow supplied-empty optional narrative, while existing SGG requires nonempty when supplied. This definition preserves the installed profile and exposes pending source-policy review, not a new waiver.",
      },
      "policy_explanation/minLength": {
        category: "intentional",
        plan: 0,
        source: 1,
        reason:
          "Original DAT/XSD allow supplied-empty optional narrative, while existing SGG requires nonempty when supplied. This definition preserves the installed profile and exposes pending source-policy review, not a new waiver.",
      },
      "program_explanation/minLength": {
        category: "intentional",
        plan: 0,
        source: 1,
        reason:
          "Original DAT/XSD allow supplied-empty optional narrative, while existing SGG requires nonempty when supplied. This definition preserves the installed profile and exposes pending source-policy review, not a new waiver.",
      },
      "applicant_signature.aor_signature/required": {
        category: "intentional",
        plan: "yes",
        source: "no",
        reason:
          "DAT/transmitted completion requires service-owned signature/date; current SGG applicant-draft profile permits absence. Readonly synthetic context is not signing or accepted source-policy change.",
      },
      "applicant_signature.submitted_date/required": {
        category: "intentional",
        plan: "yes",
        source: "no",
        reason:
          "DAT/transmitted completion requires service-owned signature/date; current SGG applicant-draft profile permits absence. Readonly synthetic context is not signing or accepted source-policy change.",
      },
      "point_of_contact_email/minLength": {
        category: "intentional",
        plan: 1,
        source: null,
        reason:
          "DAT states a one-character minimum; the existing reusable email question states format email and maxLength without a redundant minLength. The source-specific empty and malformed email tests reject both. This is a pinned facet representation difference, not a relaxed answer contract or new source-policy acceptance.",
      },
    },
  },
  xsd: {
    differingRules: {
      "ApplicantInfo/ApplicantAddress/Address/minLength": {
        category: "upstream",
        plan: 1,
        source: 0,
        reason:
          "DAT minimum is1 for the required address; the original custom XSD permits supplied-empty. Actual SGG minimum1 is preserved; source layers remain distinct.",
      },
    },
  },
  jsonSchemaVsXsd: {
    differingRules: {
      "point_of_contact_email/minLength": {
        category: "intentional",
        plan: null,
        source: 1,
        reason:
          "The reusable API email question uses format email, which rejects empty and malformed answers, rather than adding a duplicate minimum-length validator. Original XSD minimum remains one. Exact source-specific negatives verify admission; this is a facet representation difference.",
      },
      "federal_financial_assistance/enum": {
        category: "gap",
        plan: null,
        source: ["Y: Yes", "N: No"],
        reason:
          "The installed API and native Radio answer is a Boolean; original XML uses Y: Yes/N: No. Real existing SGG tests prove true/false conversion and absent omission, but this definition has no active XML mapping or conversion capability. Static crosswalk only; XML integration remains held, and this does not accept a new source policy.",
      },
      "construction_federal_assistance/enum": {
        category: "gap",
        plan: null,
        source: ["Y: Yes", "N: No"],
        reason:
          "The installed API and native Radio answer is a Boolean; original XML uses Y: Yes/N: No. Real existing SGG tests prove true/false conversion and absent omission, but this definition has no active XML mapping or conversion capability. Static crosswalk only; XML integration remains held, and this does not accept a new source policy.",
      },
      "construction_new_facilities/enum": {
        category: "gap",
        plan: null,
        source: ["Y: Yes", "N: No"],
        reason:
          "The installed API and native Radio answer is a Boolean; original XML uses Y: Yes/N: No. Real existing SGG tests prove true/false conversion and absent omission, but this definition has no active XML mapping or conversion capability. Static crosswalk only; XML integration remains held, and this does not accept a new source policy.",
      },
      "notice1/enum": {
        category: "gap",
        plan: null,
        source: ["Y: Yes", "N: No"],
        reason:
          "The installed API and native Radio answer is a Boolean; original XML uses Y: Yes/N: No. Real existing SGG tests prove true/false conversion and absent omission, but this definition has no active XML mapping or conversion capability. Static crosswalk only; XML integration remains held, and this does not accept a new source policy.",
      },
      "notice2/enum": {
        category: "gap",
        plan: null,
        source: ["Y: Yes", "N: No"],
        reason:
          "The installed API and native Radio answer is a Boolean; original XML uses Y: Yes/N: No. Real existing SGG tests prove true/false conversion and absent omission, but this definition has no active XML mapping or conversion capability. Static crosswalk only; XML integration remains held, and this does not accept a new source policy.",
      },
      "notice3/enum": {
        category: "gap",
        plan: null,
        source: ["Y: Yes", "N: No"],
        reason:
          "The installed API and native Radio answer is a Boolean; original XML uses Y: Yes/N: No. Real existing SGG tests prove true/false conversion and absent omission, but this definition has no active XML mapping or conversion capability. Static crosswalk only; XML integration remains held, and this does not accept a new source policy.",
      },
      "notice4/enum": {
        category: "gap",
        plan: null,
        source: ["Y: Yes", "N: No"],
        reason:
          "The installed API and native Radio answer is a Boolean; original XML uses Y: Yes/N: No. Real existing SGG tests prove true/false conversion and absent omission, but this definition has no active XML mapping or conversion capability. Static crosswalk only; XML integration remains held, and this does not accept a new source policy.",
      },
      "demographic_data/enum": {
        category: "gap",
        plan: null,
        source: ["Y: Yes", "N: No"],
        reason:
          "The installed API and native Radio answer is a Boolean; original XML uses Y: Yes/N: No. Real existing SGG tests prove true/false conversion and absent omission, but this definition has no active XML mapping or conversion capability. Static crosswalk only; XML integration remains held, and this does not accept a new source policy.",
      },
      "policy/enum": {
        category: "gap",
        plan: null,
        source: ["Y: Yes", "N: No"],
        reason:
          "The installed API and native Radio answer is a Boolean; original XML uses Y: Yes/N: No. Real existing SGG tests prove true/false conversion and absent omission, but this definition has no active XML mapping or conversion capability. Static crosswalk only; XML integration remains held, and this does not accept a new source policy.",
      },
      "applicant_signature.aor_signature/required": {
        category: "gap",
        plan: "no",
        source: "yes",
        reason:
          "Applicant draft permits absent system-owned signature; transmitted original XSD requires it after submission completes the context. Synthetic completed examples do not sign or submit. Integration and source-policy review remain held.",
      },
      "applicant_signature.submitted_date/required": {
        category: "gap",
        plan: "no",
        source: "yes",
        reason:
          "Applicant draft permits absent system-owned submitted date; transmitted original XSD requires it after submission completes the context. Synthetic completed examples do not submit. Integration and source-policy review remain held.",
      },
    },
  },
  dat: {
    differingLabels: {
      "01-A-1": {
        category: "upstream",
        plan: "* Name:",
        source: "Name",
        reason:
          "This DAT required field has no printed asterisk, while the maintained comparison adds one from the plan requiredness; original control punctuation is retained. This exact label record changes no answer, source obligation or requiredness.",
      },
      "01-A-2": {
        category: "upstream",
        plan: "* Address:",
        source: "Address",
        reason:
          "This DAT required field has no printed asterisk, while the maintained comparison adds one from the plan requiredness; original control punctuation is retained. This exact label record changes no answer, source obligation or requiredness.",
      },
      "01-A-3": {
        category: "upstream",
        plan: "* City:",
        source: "City",
        reason:
          "This DAT required field has no printed asterisk, while the maintained comparison adds one from the plan requiredness; original control punctuation is retained. This exact label record changes no answer, source obligation or requiredness.",
      },
      "01-A-4": {
        category: "upstream",
        plan: "* State:",
        source: "State",
        reason:
          "This DAT required field has no printed asterisk, while the maintained comparison adds one from the plan requiredness; original control punctuation is retained. This exact label record changes no answer, source obligation or requiredness.",
      },
      "01-A-5": {
        category: "upstream",
        plan: "* Zip Code:",
        source: "Zip Code",
        reason:
          "This DAT required field has no printed asterisk, while the maintained comparison adds one from the plan requiredness; original control punctuation is retained. This exact label record changes no answer, source obligation or requiredness.",
      },
      "01-B-0": {
        category: "upstream",
        plan: "* B. Unique Entity Identifier (UEI):",
        source: "B. Unique Entity Identifier (UEI)",
        reason:
          "This DAT required field has no printed asterisk, while the maintained comparison adds one from the plan requiredness; original control punctuation is retained. This exact label record changes no answer, source obligation or requiredness.",
      },
      "01-C-1": {
        category: "upstream",
        plan: "* Name:",
        source: "Name",
        reason:
          "This DAT required field has no printed asterisk, while the maintained comparison adds one from the plan requiredness; original control punctuation is retained. This exact label record changes no answer, source obligation or requiredness.",
      },
      "01-C-2": {
        category: "upstream",
        plan: "* Phone:",
        source: "Phone",
        reason:
          "This DAT required field has no printed asterisk, while the maintained comparison adds one from the plan requiredness; original control punctuation is retained. This exact label record changes no answer, source obligation or requiredness.",
      },
      "01-C-3": {
        category: "upstream",
        plan: "* Email:",
        source: "Email",
        reason:
          "This DAT required field has no printed asterisk, while the maintained comparison adds one from the plan requiredness; original control punctuation is retained. This exact label record changes no answer, source obligation or requiredness.",
      },
      "01-C-4": {
        category: "upstream",
        plan: "* Title:",
        source: "Title",
        reason:
          "This DAT required field has no printed asterisk, while the maintained comparison adds one from the plan requiredness; original control punctuation is retained. This exact label record changes no answer, source obligation or requiredness.",
      },
      "12-1-a": {
        category: "upstream",
        plan: "* A. Signature of Authorized Official",
        source: "A. Signature of Authorized Official",
        reason:
          "This DAT required field has no printed asterisk, while the maintained comparison adds one from the plan requiredness; original control punctuation is retained. This exact label record changes no answer, source obligation or requiredness.",
      },
      "12-1-b": {
        category: "upstream",
        plan: "* B. Title of Authorized Official",
        source: "B. Title of Authorized Official",
        reason:
          "This DAT required field has no printed asterisk, while the maintained comparison adds one from the plan requiredness; original control punctuation is retained. This exact label record changes no answer, source obligation or requiredness.",
      },
      "12-1-c": {
        category: "upstream",
        plan: "* C. Date",
        source: "C. Date",
        reason:
          "This DAT required field has no printed asterisk, while the maintained comparison adds one from the plan requiredness; original control punctuation is retained. This exact label record changes no answer, source obligation or requiredness.",
      },
    },
  },
  uiSchema: {
    differingHelp: {
      sam_uei: {
        category: "gap",
        plan: "Pre-populated from the Application cover sheet.",
        source:
          "Supplied by the application context. Illustrative examples provide a synthetic UEI; this preview does not fetch or copy cover-sheet data.",
        reason:
          "The source describes cover-sheet population. Existing SGG obtains UEI from organization/individual application context. Preview examples supply synthetic context; live population remains integration work and source-policy review, not a form-owned fetch/copy engine.",
      },
      "applicant_signature.aor_title": {
        category: "gap",
        plan: "Pre-populated from the Application cover sheet. This is a required field.",
        source:
          "Enter the title of the Authorized Official. This field is required and remains editable; this preview does not copy it from a cover sheet.",
        reason:
          "DAT describes cover-sheet population, while the existing applicant form keeps the authorized official title editable and required. Preserve that installed interaction without claiming cover-sheet copying or an approved source-policy change.",
      },
    },
  },
};
