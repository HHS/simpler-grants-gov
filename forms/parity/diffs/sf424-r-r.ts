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
    "The imported organization type has an optional EIN element. DAT 06-0 collects EIN/TIN once, at the required root EmployerID.",
} as const;
const draftSignature = {
  category: "intentional",
  reason:
    "The signing service supplies this value at submission. The draft can omit it and the final XML requires it.",
} as const;
const amount = {
  category: "intentional",
  reason:
    "JSON stores an exact decimal string. The pattern enforces the source limits of zero through 9999999999999.99 with at most two fractional digits.",
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
  "applicant_contact.email",
  "principal_investigator.email",
  "authorized_representative.email",
];
const funding = [
  "funding.federal",
  "funding.non_federal",
  "funding.total",
  "funding.program_income",
];
const signing = ["certification.signature", "certification.date_signed"];
const ein = byPath(["ApplicantInfo/OrganizationInfo/EIN"], importedEin);

// Only the capitalization of “State” differs in the inherited applicant-type bank.
const applicantTypeH =
  "H: Public/state Controlled Institution of Higher Education";

const applicantTypes = [
  "A: State Government",
  "B: County Government",
  "C: City or Township Government",
  "D: Special District Government",
  "E: Regional Organization",
  "F: U.S. Territory or Possession",
  "G: Independent School District",
  applicantTypeH,
  "I: Indian/Native American Tribal Government (Federally Recognized)",
  "J: Indian/Native American Tribal Government (Other than Federally Recognized)",
  "K: Indian/Native American Tribally Designated Organization",
  "L: Public/Indian Housing Authority",
  "M: Nonprofit with 501C3 IRS Status (Other than Institution of Higher Education)",
  "N: Nonprofit without 501C3 IRS Status (Other than Institution of Higher Education)",
  "O: Private Institution of Higher Education",
  "P: Individual",
  "Q: For-Profit Organization (Other than Small Business)",
  "R: Small Business",
  "S: Hispanic-serving Institution",
  "T: Historically Black Colleges and Universities (HBCUs)",
  "U: Tribally Controlled Colleges and Universities (TCCUs)",
  "V: Alaska Native and Native Hawaiian Serving Institutions",
  "W: Non-domestic (non-US) Entity",
  "X: Other (specify)",
];

export const DIFF: FormDiff = {
  slug: "sf424-r-r",
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
  },
  xsd: { absentFromPlan: ein },
  jsonSchema: {
    differingRules: {
      ...byRule(emails, {
        minLength: { ...EMAIL_MIN_LENGTH, plan: 1, source: null },
        format: { ...EMAIL_MIN_LENGTH, plan: null, source: "email" },
      }),
      ...byRule(funding, {
        minimum: { ...amount, plan: 0, source: null },
        maximum: { ...amount, plan: 9999999999999.99, source: null },
        pattern: {
          ...amount,
          plan: null,
          source: "^(?:0|[1-9][0-9]{0,12})(?:[.][0-9]{1,2})?$",
        },
      }),
      ...byRule(signing, {
        required: { ...draftSignature, plan: "yes", source: "no" },
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
        "applicant_organization.name",
        "applicant_organization.employer_id",
        "application.application_type",
        "application.revision_code",
        "application.revision_explanation",
        "application.submitted_to_other_agencies",
        "application.other_agency_explanation",
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
      ...byRule(signing, {
        required: { ...draftSignature, plan: "no", source: "yes" },
      }),
      ...byRule(
        [
          "applicant_type.small_business.women_owned",
          "applicant_type.small_business.socially_and_economically_disadvantaged",
          "application.submitted_to_other_agencies",
        ],
        { enum: { ...yesNo, plan: null, source: ["Y: Yes", "N: No"] } },
      ),
      "certification.agree/enum": {
        ...yesNo,
        reason:
          "Submitting the certification requires agreement. The XML mapping writes Y: Yes.",
        plan: ["true"],
        source: ["Y: Yes", "N: No"],
      },
      "applicant_type.code/enum": {
        category: "intentional",
        reason:
          "The shared applicant type uses a lowercase s in the H label. The XML mapping writes the exact capitalized source value.",
        plan: applicantTypes,
        source: applicantTypes.map((type) =>
          type === applicantTypeH
            ? "H: Public/State Controlled Institution of Higher Education"
            : type,
        ),
      },
    },
  },
  xmlMappingVsXsd: { absentFromPlan: ein },
};
