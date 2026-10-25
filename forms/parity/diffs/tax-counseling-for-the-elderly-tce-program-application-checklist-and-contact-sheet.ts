import type { FormDiff } from "../harness/model.ts";

// Tuples are [source coordinate, proposed value, original source value].
// Every value remains pinned; source/plan changes still invalidate the record.
export const DIFF: FormDiff = {
  slug: "tax-counseling-for-the-elderly-tce-program-application-checklist-and-contact-sheet",
  dat: {
    differingLabels: {
      ...Object.fromEntries(
        (
          [
            ["1-1", "* Name of organization", "Name of organization"],
            ["1-2-1", "* Street address line 1", "Street address line 1"],
            ["1-2-3", "* City", "City"],
            ["1-2-6", "* Country", "Country"],
            ["1-3", "* Telephone", "Telephone"],
            ["1-5-2", "* First Name", "First Name"],
            ["1-5-4", "* Last Name", "Last Name"],
            ["1-7", "* Email address for POC", "Email address for POC"],
            [
              "2-1",
              "* Has your organization registered or renewed your registration this year through the System for Award Management (SAM) at www.sam.gov?",
              "Has your organization registered or renewed your registration this year through the System for Award Management (SAM) at www.sam.gov?",
            ],
            [
              "2-2",
              "* Is your organization interested in applying for a multi-year grant?",
              "Is your organization interested in applying for a multi-year grant?",
            ],
            [
              "3-2-01",
              "* 1. Form 14204, TCE Application Checklist & Contact Sheet (this sheet)",
              "1. Form 14204, TCE Application Checklist & Contact Sheet (this sheet)",
            ],
            ["3-2-02", "* 2. Background Narrative", "2. Background Narrative"],
            [
              "3-2-03",
              "* 3. Nonprofit Status Determination letter issued by the Internal Revenue Service",
              "3. Nonprofit Status Determination letter issued by the Internal Revenue Service",
            ],
            [
              "3-2-05",
              "* 5. Proposed Program/Budget Plan",
              "5. Proposed Program/Budget Plan",
            ],
            [
              "3-2-06",
              "* 6. Form 8653 - TCE Application Plan",
              "6. Form 8653 - TCE Application Plan",
            ],
            [
              "3-2-07",
              "* 7. Standard Form 424, Application for Federal Assistance",
              "7. Standard Form 424, Application for Federal Assistance",
            ],
            [
              "3-2-08",
              "* 8. Civil Rights Narrative",
              "8. Civil Rights Narrative",
            ],
            [
              "3-2-09",
              "* 9. Form 14335, Contact Information for VITA & TCE",
              "9. Form 14335, Contact Information for VITA & TCE",
            ],
          ] as const
        ).map(([key, plan, source]) => [
          key,
          {
            category: "intentional" as const,
            reason:
              "Required markers, punctuation or whitespace differ in presentation only. The source field, meaning, requiredness and value remain unchanged.",
            plan,
            source,
          },
        ]),
      ),
    },
    differingRules: {
      ...Object.fromEntries(
        (
          [
            ["1-2-4/maxLength", null, 55],
            ["1-2-6/maxLength", null, 49],
          ] as const
        ).map(([key, plan, source]) => [
          key,
          {
            category: "upstream" as const,
            reason:
              "The DAT states a generic maximum length for a code-list field; the original XSD and shared vocabulary define the exact finite StateCodeDataTypeV3/CountryCodeDataTypeV3 values instead. The question uses that exact source enumeration rather than adding a string-shape override. Source enum values and encoded lengths are separately checked.",
            plan,
            source,
          },
        ]),
      ),
      ...Object.fromEntries(
        ([["2-3/required", "conditional", "yes"]] as const).map(
          ([key, plan, source]) => [
            key,
            {
              category: "upstream" as const,
              reason:
                "DAT D35 says required, but K35 explicitly enables/requires the eligibility-review answer only when MultiyearGrant is Yes and disables it otherwise. The original XSD makes the element optional. The definition follows that explicit source condition, with Yes/No/absent transition cases.",
              plan,
              source,
            },
          ],
        ),
      ),
    },
    differingHelp: {
      ...Object.fromEntries(
        (
          [
            [
              "1-2-1",
              "Enter the first line of the street address.",
              "Pre-populated from the SF 424. This field is required.",
            ],
            [
              "1-2-2",
              "Enter the second line of the street address.",
              "Pre-populated from the SF 424.",
            ],
            [
              "1-2-3",
              "Enter the city.",
              "Pre-populated from the SF 424. This field is required.",
            ],
            [
              "1-2-4",
              "US State or Territory Code",
              "Pre-populated from the SF 424. This field is required if Country is the United States.",
            ],
            ["1-2-5", "Enter the province.", "Pre-populated from the SF 424."],
            [
              "1-2-6",
              "Country Code",
              "Pre-populated from the SF 424. This field is required.",
            ],
            [
              "1-2-7",
              "Enter the zip / postal code.",
              "Pre-populated from the SF 424. This field is required if Country is the United States.",
            ],
            ["1-5-1", "Enter the prefix.", "Pre-populated from the SF 424."],
            [
              "1-5-2",
              "Enter the first name.",
              "Pre-populated from the SF 424. This field is required.",
            ],
            [
              "1-5-3",
              "Enter the middle name.",
              "Pre-populated from the SF 424.",
            ],
            [
              "1-5-4",
              "Enter the last name.",
              "Pre-populated from the SF 424. This field is required.",
            ],
            ["1-5-5", "Enter the suffix.", "Pre-populated from the SF 424."],
          ] as const
        ).map(([key, plan, source]) => [
          key,
          {
            category: "intentional" as const,
            reason:
              "Reuse established question/part help. The role heading, readonly schema/controls and plan pre_populated values retain exact source ownership; original source-specific instructions remain available in the pinned DAT and plan context. No new signing or automatic population behavior is implied.",
            plan,
            source,
          },
        ]),
      ),
    },
  },
  xsd: {
    differingRules: {
      ...Object.fromEntries(
        ([["ContactInformation/Email/minLength", null, 1]] as const).map(
          ([key, plan, source]) => [
            key,
            {
              category: "intentional" as const,
              reason:
                "The existing shared email question uses format email, which already rejects an empty string, rather than a redundant minLength error. MaxLength60 and source invalid-email instructions are preserved and tested with actual invalid/empty email cases.",
              plan,
              source,
            },
          ],
        ),
      ),
      ...Object.fromEntries(
        (
          [
            ["ApplicationChecklist/Form14204/pattern", "^Y:\\x20Yes$", null],
            [
              "ApplicationChecklist/BackgroundNarrative/pattern",
              "^Y:\\x20Yes$",
              null,
            ],
            [
              "ApplicationChecklist/NonprofitStatus/pattern",
              "^Y:\\x20Yes$",
              null,
            ],
            [
              "ApplicationChecklist/ProgramBudgetPlan/pattern",
              "^Y:\\x20Yes$",
              null,
            ],
            ["ApplicationChecklist/Form8653/pattern", "^Y:\\x20Yes$", null],
            [
              "ApplicationChecklist/StandardForm424/pattern",
              "^Y:\\x20Yes$",
              null,
            ],
            [
              "ApplicationChecklist/CivilRightsNarrative/pattern",
              "^Y:\\x20Yes$",
              null,
            ],
            ["ApplicationChecklist/Form14335/pattern", "^Y:\\x20Yes$", null],
          ] as const
        ).map(([key, plan, source]) => [
          key,
          {
            category: "intentional" as const,
            reason:
              "The source marks this document checklist box required and instructs Check to select. The proposed definition requires the affirmative Y: Yes confirmation using an occurrence-level pattern on the existing exact Yes/No vocabulary. The XSD only lists the two codes. This narrower PDF/DAT interpretation is explicit for source-owner review, not recorded as human policy acceptance; optional items remain unrestricted.",
            plan,
            source,
          },
        ]),
      ),
    },
  },
  jsonSchemaVsXsd: {
    differingRules: {
      ...Object.fromEntries(
        ([["contact_information.email/minLength", null, 1]] as const).map(
          ([key, plan, source]) => [
            key,
            {
              category: "intentional" as const,
              reason:
                "The existing shared email question uses format email, which already rejects an empty string, rather than a redundant minLength error. MaxLength60 and source invalid-email instructions are preserved and tested with actual invalid/empty email cases.",
              plan,
              source,
            },
          ],
        ),
      ),
    },
  },
};
