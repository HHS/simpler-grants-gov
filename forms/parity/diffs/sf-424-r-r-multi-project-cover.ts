import type { FormDiff, Pinned, Recorded } from "../harness/model.ts";
import { EMAIL_MIN_LENGTH } from "./common.ts";

const choiceRow = {
  category: "intentional",
  reason: "These DAT rows are choices for a single answer in the plan.",
} as const;
const revisionRows = {
  category: "intentional",
  reason:
    "DAT 08-1-1 to 08-1-5 share the single RevisionCode XML element. The preview offers the nine legal codes in one dropdown while the checkbox design is reviewed.",
} as const;
const importedEin = {
  category: "upstream",
  reason:
    "OptionalOrganizationType has an optional EIN element. DAT 06-0 collects EIN/TIN once, at the root EmployerID.",
} as const;
const amount = {
  category: "intentional",
  reason:
    "The form uses the shared BudgetTotalAmount question for globLib:BudgetTotalAmountDataType. It stores an exact decimal string, and its pattern allows 0 through 9999999999999.99 with exactly two decimal places when cents are given.",
} as const;
const district = {
  category: "intentional",
  reason:
    "The form uses the shared congressional district question, which requires the DAT's format: two state characters, a hyphen and three characters (MA-007, MD-all, 00-000). globLib:CongressionalDistrictDataType allows 1 to 6 characters with no pattern.",
} as const;
const yesNo = {
  category: "intentional",
  reason:
    "The form stores a boolean. The XML mapping writes the exact source Yes/No value.",
} as const;
const layout = {
  category: "intentional",
  reason:
    "The preview groups related answers so applicants can complete them together. The XML mapping retains the source element order.",
} as const;

const byPath = <T extends Recorded>(paths: string[], reason: T) =>
  Object.fromEntries(paths.map((path) => [path, reason]));

const byRule = (paths: string[], rules: Record<string, Pinned>) =>
  Object.fromEntries(
    paths.flatMap((path) =>
      Object.entries(rules).map(([rule, values]) => [
        `${path}/${rule}`,
        values,
      ]),
    ),
  );

const emails = [
  "contacts.point_of_contact.email",
  "contacts.project_director.email",
  "contacts.authorized_representative.email",
];
const funding = [
  "budget.funding_sources.federal",
  "budget.funding_sources.non_federal",
  "budget.funding_sources.total",
  "budget.funding_sources.program_income",
];
const ein = byPath(["ApplicantInfo/OrganizationInfo/EIN"], importedEin);
const fundingXml = [
  "EstimatedProjectFunding/TotalEstimatedAmount",
  "EstimatedProjectFunding/TotalNonfedrequested",
  "EstimatedProjectFunding/TotalfedNonfedrequested",
  "EstimatedProjectFunding/EstimatedProgramIncome",
];
const amountPattern = "^\\d{1,13}([.]\\d{2})?$";

export const DIFF: FormDiff = {
  slug: "sf-424-r-r-multi-project-cover",
  xml: "xml-mapping",
  wording: {
    labels: {
      category: "intentional",
      reason:
        "The plan matches the bank and form labels used in the preview. The DAT retains the numbered source labels.",
    },
    help: {
      category: "intentional",
      reason:
        "The plan uses shared bank help and concise form-specific instructions. The DAT comparison retains the original wording.",
    },
  },
  dat: {
    absentFromPlan: {
      ...byPath(
        [
          "01-1",
          "01-2",
          "01-3",
          "08-0-1",
          "08-0-2",
          "08-0-3",
          "08-0-4",
          "08-0-5",
          "08-2-1",
          "08-2-2",
          "16-2",
          "16-5",
          "16-6",
        ],
        choiceRow,
      ),
      ...byPath(
        ["08-1-1", "08-1-2", "08-1-3", "08-1-4", "08-1-5"],
        revisionRows,
      ),
    },
    absentFromSource: { "08-1-1 through 08-1-5": revisionRows },
    differingRules: byRule(["15-1", "15-2", "15-3", "15-4"], {
      maxLength: { ...amount, plan: 16, source: null },
    }),
  },
  xsd: {
    absentFromPlan: ein,
    differingRules: {
      ...byRule(["CongressionalDistrict/ApplicantCongressionalDistrict"], {
        minLength: { ...district, plan: 6, source: 1 },
        pattern: {
          ...district,
          plan: "^[A-Z0-9]{2}-[A-Za-z0-9]{3}$",
          source: null,
        },
      }),
      ...byRule(fundingXml, {
        maxLength: { ...amount, plan: 16, source: null },
        pattern: { ...amount, plan: amountPattern, source: null },
        minimum: { ...amount, plan: null, source: 0 },
        maximum: { ...amount, plan: null, source: 9999999999999.99 },
      }),
    },
  },
  jsonSchema: {
    differingRules: {
      ...byRule(emails, {
        minLength: { ...EMAIL_MIN_LENGTH, plan: 1, source: null },
        format: { ...EMAIL_MIN_LENGTH, plan: null, source: "email" },
      }),
      ...byRule(
        [
          "attachments.lobbying_disclosure",
          "attachments.pre_application",
          "attachments.cover_letter",
        ],
        {
          format: {
            category: "intentional",
            reason:
              "The JSON answer holds the uploaded file's UUID. The XML mapping writes its attachment descriptor.",
            plan: null,
            source: "uuid",
          },
        },
      ),
    },
  },
  uiSchema: {
    outOfOrder: byPath(
      [
        "applicant.organization.name",
        "applicant.organization.ein",
        "application.application_type",
        "application.revision.type",
        "application.revision.other_specify",
        "application.other_agencies.submitted",
        "application.other_agencies.explanation",
        "attachments.lobbying_disclosure",
        "certification.signature",
        "certification.date_signed",
      ],
      layout,
    ),
  },
  jsonSchemaVsXsd: {
    differingRules: {
      ...byRule(emails, { minLength: EMAIL_MIN_LENGTH }),
      ...byRule(funding, {
        minimum: { ...amount, plan: null, source: 0 },
        maximum: { ...amount, plan: null, source: 9999999999999.99 },
      }),
      ...byRule(
        [
          "applicant.type.small_business.women_owned",
          "applicant.type.small_business.socially_disadvantaged",
          "application.other_agencies.submitted",
        ],
        { enum: { ...yesNo, plan: null, source: ["Y: Yes", "N: No"] } },
      ),
      "certification.agree/enum": {
        ...yesNo,
        reason:
          "Checking I agree records agreement, and leaving it unchecked omits TrustAgree. The XML mapping writes Y: Yes.",
        plan: ["true"],
        source: ["Y: Yes", "N: No"],
      },
    },
  },
  xmlMappingVsXsd: { absentFromPlan: ein },
};
