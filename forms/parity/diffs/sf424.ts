import type { FormDiff } from "../harness/model.ts";
import { BANK_WORDING } from "./common.ts";

const choice = {
  category: "upstream",
  reason:
    "This DAT row describes one choice of an existing answer. It does not have a separate answer or XML value.",
} as const;
const datSlots = {
  category: "intentional",
  reason:
    "The maintained SGG form collects one ordered list of up to three types. The plan lists the three numbered DAT slots in source_bindings.",
} as const;
const xsdSlots = {
  category: "intentional",
  reason:
    "The plan represents the three named XSD elements as one ordered list. It retains each element in source_bindings.",
} as const;
const wireSlots = {
  category: "gap",
  reason:
    "The TypeSpec emitter cannot fan one array into ApplicantTypeCode1–3 or apply the maintained API H-label transform per item. Wire parity is pending.",
} as const;
const draft = {
  category: "intentional",
  reason:
    "This submission field is optional in a draft. SGG fills it at submission and the source requires it in final XML.",
} as const;
const total = {
  category: "gap",
  reason:
    "The DAT and XSD require the total. The draft leaves it read-only and optional pending a binding to the existing six-input SGG sum_monetary provider.",
} as const;
const money = {
  category: "gap",
  reason:
    "Current SGG stores a monetary string with a 14-character limit. The original XSD validates a nonnegative decimal and allows a larger total. The integration must resolve admissions and preserve valid wire values.",
} as const;
const moneyDat = {
  category: "intentional",
  reason:
    "The 14-character cap comes from the maintained SGG string schema. The DAT column states a monetary maximum instead of a string length.",
} as const;
const attachments = {
  category: "intentional",
  reason:
    "The DAT lists one attachment container. The original XSD and maintained SGG form allow up to 100 files within that container.",
} as const;
const regularContact = {
  category: "upstream",
  reason:
    "The DAT and maintained SGG form require first and last name. The original XSD permits the whole contact name to be omitted.",
} as const;
const email = {
  category: "intentional",
  reason:
    "The email format already rejects empty values in the form schema. The XSD states a separate minimum length of one.",
} as const;
const bool = {
  category: "intentional",
  reason:
    "The form stores a Boolean. The authored XML transform writes the source Yes/No enumeration.",
} as const;

export const DIFF: FormDiff = {
  slug: "sf424",
  xml: "xml-mapping",
  wording: BANK_WORDING,
  dat: {
    absentFromPlan: {
      "01-1": choice,
      "01-2": choice,
      "01-3": choice,
      "02-01": choice,
      "02-02": choice,
      "02-03": choice,
      "09-0": datSlots,
      "09-1": datSlots,
      "09-2": datSlots,
      "19-a": choice,
      "19-b": choice,
      "19-c": choice,
      "20-1": choice,
      "20-2": choice,
    },
    differingRules: {
      "03-0/required": { ...draft, plan: "no", source: "yes" },
      "18-a/maxLength": { ...moneyDat, plan: 14, source: null },
      "18-b/maxLength": { ...moneyDat, plan: 14, source: null },
      "18-c/maxLength": { ...moneyDat, plan: 14, source: null },
      "18-d/maxLength": { ...moneyDat, plan: 14, source: null },
      "18-e/maxLength": { ...moneyDat, plan: 14, source: null },
      "18-f/maxLength": { ...moneyDat, plan: 14, source: null },
      "18-g/required": { ...total, plan: "no", source: "yes" },
      "18-g/maxLength": { ...moneyDat, plan: 14, source: null },
      "22-10/required": { ...draft, plan: "no", source: "yes" },
      "22-11/required": { ...draft, plan: "no", source: "yes" },
      "15-1/maxOccurs": { ...attachments, plan: 100, source: 1 },
    },
  },
  xsd: {
    absentFromPlan: {
      ApplicantTypeCode1: xsdSlots,
      ApplicantTypeCode2: xsdSlots,
      ApplicantTypeCode3: xsdSlots,
    },
    differingRules: {
      "DateReceived/required": { ...draft, plan: "no", source: "yes" },
      "ContactPerson/FirstName/required": {
        ...regularContact,
        plan: "yes",
        source: "no",
      },
      "ContactPerson/LastName/required": {
        ...regularContact,
        plan: "yes",
        source: "no",
      },
      "Email/minLength": { ...email, plan: null, source: 1 },
      "FederalEstimatedFunding/minLength": { ...money, plan: 1, source: null },
      "FederalEstimatedFunding/maxLength": { ...money, plan: 14, source: null },
      "FederalEstimatedFunding/pattern": {
        ...money,
        plan: "^(-)?\\d*([.]\\d{2})?$",
        source: null,
      },
      "FederalEstimatedFunding/minimum": { ...money, plan: null, source: 0 },
      "FederalEstimatedFunding/maximum": {
        ...money,
        plan: null,
        source: 999999999999.99,
      },
      "ApplicantEstimatedFunding/minLength": {
        ...money,
        plan: 1,
        source: null,
      },
      "ApplicantEstimatedFunding/maxLength": {
        ...money,
        plan: 14,
        source: null,
      },
      "ApplicantEstimatedFunding/pattern": {
        ...money,
        plan: "^(-)?\\d*([.]\\d{2})?$",
        source: null,
      },
      "ApplicantEstimatedFunding/minimum": { ...money, plan: null, source: 0 },
      "ApplicantEstimatedFunding/maximum": {
        ...money,
        plan: null,
        source: 999999999999.99,
      },
      "StateEstimatedFunding/minLength": { ...money, plan: 1, source: null },
      "StateEstimatedFunding/maxLength": { ...money, plan: 14, source: null },
      "StateEstimatedFunding/pattern": {
        ...money,
        plan: "^(-)?\\d*([.]\\d{2})?$",
        source: null,
      },
      "StateEstimatedFunding/minimum": { ...money, plan: null, source: 0 },
      "StateEstimatedFunding/maximum": {
        ...money,
        plan: null,
        source: 999999999999.99,
      },
      "LocalEstimatedFunding/minLength": { ...money, plan: 1, source: null },
      "LocalEstimatedFunding/maxLength": { ...money, plan: 14, source: null },
      "LocalEstimatedFunding/pattern": {
        ...money,
        plan: "^(-)?\\d*([.]\\d{2})?$",
        source: null,
      },
      "LocalEstimatedFunding/minimum": { ...money, plan: null, source: 0 },
      "LocalEstimatedFunding/maximum": {
        ...money,
        plan: null,
        source: 999999999999.99,
      },
      "OtherEstimatedFunding/minLength": { ...money, plan: 1, source: null },
      "OtherEstimatedFunding/maxLength": { ...money, plan: 14, source: null },
      "OtherEstimatedFunding/pattern": {
        ...money,
        plan: "^(-)?\\d*([.]\\d{2})?$",
        source: null,
      },
      "OtherEstimatedFunding/minimum": { ...money, plan: null, source: 0 },
      "OtherEstimatedFunding/maximum": {
        ...money,
        plan: null,
        source: 999999999999.99,
      },
      "ProgramIncomeEstimatedFunding/minLength": {
        ...money,
        plan: 1,
        source: null,
      },
      "ProgramIncomeEstimatedFunding/maxLength": {
        ...money,
        plan: 14,
        source: null,
      },
      "ProgramIncomeEstimatedFunding/pattern": {
        ...money,
        plan: "^(-)?\\d*([.]\\d{2})?$",
        source: null,
      },
      "ProgramIncomeEstimatedFunding/minimum": {
        ...money,
        plan: null,
        source: 0,
      },
      "ProgramIncomeEstimatedFunding/maximum": {
        ...money,
        plan: null,
        source: 999999999999.99,
      },
      "TotalEstimatedFunding/required": { ...total, plan: "no", source: "yes" },
      "TotalEstimatedFunding/minLength": { ...money, plan: 1, source: null },
      "TotalEstimatedFunding/maxLength": { ...money, plan: 14, source: null },
      "TotalEstimatedFunding/pattern": {
        ...money,
        plan: "^(-)?\\d*([.]\\d{2})?$",
        source: null,
      },
      "TotalEstimatedFunding/minimum": { ...money, plan: null, source: 0 },
      "TotalEstimatedFunding/maximum": {
        ...money,
        plan: null,
        source: 9999999999999.99,
      },
      "DelinquentFederalDebt/enumType": {
        ...bool,
        plan: null,
        source: "YesNoDataType",
      },
      "CertificationAgree/enumType": {
        ...bool,
        plan: null,
        source: "YesNoDataType",
      },
      "AuthorizedRepresentativeEmail/minLength": {
        ...email,
        plan: null,
        source: 1,
      },
      "AORSignature/required": { ...draft, plan: "no", source: "yes" },
      "DateSigned/required": { ...draft, plan: "no", source: "yes" },
    },
  },
  jsonSchemaVsXsd: {
    differingRules: {
      "application.date_received/required": {
        ...draft,
        plan: "no",
        source: "yes",
      },
      "contact.email/minLength": { ...email, plan: null, source: 1 },
      "funding.federal/minimum": { ...money, plan: null, source: 0 },
      "funding.federal/maximum": {
        ...money,
        plan: null,
        source: 999999999999.99,
      },
      "funding.applicant/minimum": { ...money, plan: null, source: 0 },
      "funding.applicant/maximum": {
        ...money,
        plan: null,
        source: 999999999999.99,
      },
      "funding.state/minimum": { ...money, plan: null, source: 0 },
      "funding.state/maximum": {
        ...money,
        plan: null,
        source: 999999999999.99,
      },
      "funding.local/minimum": { ...money, plan: null, source: 0 },
      "funding.local/maximum": {
        ...money,
        plan: null,
        source: 999999999999.99,
      },
      "funding.other/minimum": { ...money, plan: null, source: 0 },
      "funding.other/maximum": {
        ...money,
        plan: null,
        source: 999999999999.99,
      },
      "funding.program_income/minimum": { ...money, plan: null, source: 0 },
      "funding.program_income/maximum": {
        ...money,
        plan: null,
        source: 999999999999.99,
      },
      "funding.total/required": { ...total, plan: "no", source: "yes" },
      "funding.total/minimum": { ...money, plan: null, source: 0 },
      "funding.total/maximum": {
        ...money,
        plan: null,
        source: 9999999999999.99,
      },
      "debt.is_delinquent/enum": {
        ...bool,
        plan: null,
        source: ["Y: Yes", "N: No"],
      },
      "certification.agree/enum": {
        ...bool,
        plan: null,
        source: ["Y: Yes", "N: No"],
      },
      "authorized_representative.email/minLength": {
        ...email,
        plan: null,
        source: 1,
      },
      "authorized_representative.signature/required": {
        ...draft,
        plan: "no",
        source: "yes",
      },
      "authorized_representative.date_signed/required": {
        ...draft,
        plan: "no",
        source: "yes",
      },
    },
  },
  xmlMappingVsJsonSchema: {
    absentFromPlan: {
      "applicant_type.codes[]": wireSlots,
    },
  },
  xmlMappingVsXsd: {
    absentFromPlan: {
      ApplicantTypeCode1: wireSlots,
      ApplicantTypeCode2: wireSlots,
      ApplicantTypeCode3: wireSlots,
    },
  },
};
