import type { FormDiff, Pinned } from "../harness/model.ts";
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
const mappedSlots = {
  category: "intentional",
  reason:
    "The plan lists the applicant types once, as one ordered list. The XML mapping writes each item to its numbered element.",
} as const;
const draft = {
  category: "intentional",
  reason:
    "This submission field is optional in a draft. SGG fills it at submission and the source requires it in final XML.",
} as const;
const total = {
  category: "intentional",
  reason:
    "SGG calculates the total from the six amounts before it validates, so the applicant never enters it. The form leaves it optional so a draft saves before the calculation runs.",
} as const;
const money = {
  category: "intentional",
  reason:
    "The shared budget questions store an amount as a string, as the API's budget forms do, so no amount is rounded. Their pattern admits only nonnegative amounts within the XSD's digits instead of stating a numeric range. The existing form also accepted a leading minus and up to 14 characters.",
} as const;
const moneyDat = {
  category: "intentional",
  reason:
    "The string length comes from the shared budget question: the XSD's digits, a decimal point, and two decimal places. The DAT column states a monetary maximum instead of a string length.",
} as const;
const district = {
  category: "intentional",
  reason:
    "The shared congressional district question requires the format the DAT's help describes: two characters, a hyphen, and three characters. The XSD's type allows any 1–6 characters.",
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
const agree = {
  category: "intentional",
  reason:
    "The shared certification must be checked to submit. The authored XML transform writes Y: Yes.",
} as const;

const AMOUNTS = [
  ["federal", "Federal", "18-a"],
  ["applicant", "Applicant", "18-b"],
  ["state", "State", "18-c"],
  ["local", "Local", "18-d"],
  ["other", "Other", "18-e"],
  ["program_income", "ProgramIncome", "18-f"],
] as const;
const AMOUNT_PATTERN = "^\\d{1,12}([.]\\d{2})?$";
const TOTAL_PATTERN = "^\\d{1,13}([.]\\d{2})?$";
const AMOUNT_MAX = 999999999999.99;
const TOTAL_MAX = 9999999999999.99;

/** Each amount's rules against the DAT, keyed by DAT row. */
const datAmounts = (): Record<string, Pinned> => ({
  ...Object.fromEntries(
    AMOUNTS.map(([, , row]) => [
      `${row}/maxLength`,
      { ...moneyDat, plan: 15, source: null },
    ]),
  ),
  "18-g/maxLength": { ...moneyDat, plan: 16, source: null },
});

/** Each amount's rules against the XSD, keyed by element. */
const xsdAmounts = (): Record<string, Pinned> => {
  const rules = (
    element: string,
    length: number,
    pattern: string,
    max: number,
  ): [string, Pinned][] => [
    [`${element}/maxLength`, { ...money, plan: length, source: null }],
    [`${element}/pattern`, { ...money, plan: pattern, source: null }],
    [`${element}/minimum`, { ...money, plan: null, source: 0 }],
    [`${element}/maximum`, { ...money, plan: null, source: max }],
  ];
  return Object.fromEntries([
    ...AMOUNTS.flatMap(([, element]) =>
      rules(`${element}EstimatedFunding`, 15, AMOUNT_PATTERN, AMOUNT_MAX),
    ),
    ...rules("TotalEstimatedFunding", 16, TOTAL_PATTERN, TOTAL_MAX),
  ]);
};

/** Each amount's numeric range against the XSD, keyed by JSON path. */
const schemaAmounts = (): Record<string, Pinned> =>
  Object.fromEntries(
    [
      ...AMOUNTS.map(([key]) => [key, AMOUNT_MAX] as const),
      ["total", TOTAL_MAX] as const,
    ].flatMap(([key, max]) => [
      [
        `budget.funding_sources.${key}/minimum`,
        { ...money, plan: null, source: 0 },
      ],
      [
        `budget.funding_sources.${key}/maximum`,
        { ...money, plan: null, source: max },
      ],
    ]),
  );

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
      ...datAmounts(),
      "18-g/required": { ...total, plan: "no", source: "yes" },
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
      "StateApplicationID/minLength": {
        plan: 1,
        source: 0,
        category: "intentional",
        reason:
          "The form reuses the shared state application identifier question, which rejects an empty string. Leaving the optional field blank omits it, so no answer the XSD accepts is lost.",
      },
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
      "CongressionalDistrictApplicant/minLength": {
        ...district,
        plan: 6,
        source: 1,
      },
      "CongressionalDistrictApplicant/pattern": {
        ...district,
        plan: "^[A-Z0-9]{2}-[A-Za-z0-9]{3}$",
        source: null,
      },
      "CongressionalDistrictProgramProject/minLength": {
        ...district,
        plan: 6,
        source: 1,
      },
      "CongressionalDistrictProgramProject/pattern": {
        ...district,
        plan: "^[A-Z0-9]{2}-[A-Za-z0-9]{3}$",
        source: null,
      },
      ...xsdAmounts(),
      "TotalEstimatedFunding/required": { ...total, plan: "no", source: "yes" },
      "DelinquentFederalDebt/enumType": {
        ...bool,
        plan: null,
        source: "YesNoDataType",
      },
      "CertificationAgree/enumType": {
        ...agree,
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
      "contacts.point_of_contact.email/minLength": {
        ...email,
        plan: null,
        source: 1,
      },
      ...schemaAmounts(),
      "budget.funding_sources.total/required": {
        ...total,
        plan: "no",
        source: "yes",
      },
      "applicant.delinquent_federal_debt.answer/enum": {
        ...bool,
        plan: null,
        source: ["Y: Yes", "N: No"],
      },
      "certification.agree/enum": {
        ...agree,
        plan: ["true"],
        source: ["Y: Yes", "N: No"],
      },
      "contacts.authorized_representative.email/minLength": {
        ...email,
        plan: null,
        source: 1,
      },
      "certification.signature/required": {
        ...draft,
        plan: "no",
        source: "yes",
      },
      "certification.date_signed/required": {
        ...draft,
        plan: "no",
        source: "yes",
      },
    },
  },
  xmlMapping: {
    absentFromPlan: {
      "applicant.type.codes[] -> ApplicantTypeCode1": mappedSlots,
      "applicant.type.codes[] -> ApplicantTypeCode2": mappedSlots,
      "applicant.type.codes[] -> ApplicantTypeCode3": mappedSlots,
    },
  },
};
