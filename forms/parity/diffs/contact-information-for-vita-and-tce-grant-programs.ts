import type { FormDiff } from "../harness/model.ts";

// Tuples are [source coordinate, proposed value, original source value].
// Every value remains pinned; source/plan changes still invalidate the record.
export const DIFF: FormDiff = {
  slug: "contact-information-for-vita-and-tce-grant-programs",
  dat: {
    differingLabels: {
      ...Object.fromEntries(
        (
          [
            ["1-00", "* Recipient name", "Recipient name"],
            ["1-02-1", "* Street address line 1", "Street address line 1"],
            ["1-02-3", "* City", "City"],
            ["1-02-6", "* Country", "Country"],
            ["1-03", "* Days of operation", "Days of operation"],
            ["1-04", "* Hours of operation", "Hours of operation"],
            ["1-07", "* Title", "Title"],
            ["1-08", "* Phone number", "Phone number"],
            ["1-10", "* Email address", "Email address"],
            [
              "1-11",
              "* May the IRS share the Primary Contacts information with other grant recipients and non-grant recipients involved in the VITA or TCE program",
              "May the IRS share the Primary Contacts information with other grant recipients and non-grant recipients involved in the VITA or TCE program",
            ],
            ["2-2", "* Title", "Title"],
            ["2-3", "* Phone number", "Phone number"],
            ["2-5", "* Email address", "Email address"],
            [
              "2-6",
              "* May the IRS share the Alternate Contacts information with other grant recipients and non-grant recipients involved in the VITA or TCE program",
              "May the IRS share the Alternate Contacts information with other grant recipients and non-grant recipients involved in the VITA or TCE program",
            ],
            ["3-2", "* Title", "Title"],
            ["3-3", "* Phone number", "Phone number"],
            ["3-5", "* Email address", "Email address"],
            [
              "3-6",
              "* May the IRS share the Authorized Organization Representatives information with other grant recipients and non-grant recipients involved in the VITA or TCE program",
              "May the IRS share the Authorized Organization Representatives information with other grant recipients and non-grant recipients involved in the VITA or TCE program",
            ],
            ["4-2", "* Title", "Title"],
            ["4-3", "* Phone number", "Phone number"],
            ["4-5", "* Email address", "Email address"],
            ["5-2", "* Title", "Title"],
            ["5-3", "* Phone number", "Phone number"],
            ["5-5", "* Email address", "Email address"],
            ["6-0-1", "Explain role:", "Explain role"],
            ["7-0-1", "Explain role:", "Explain role"],
            ["8-0-1", "Explain role:", "Explain role"],
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
      ...Object.fromEntries(
        (
          [
            ["1-06-1", "Prefix", "Primary contact prefix"],
            ["1-06-2", "* First Name", "Primary contact first name"],
            ["1-06-3", "Middle Name", "Primary contact middle name"],
            ["1-06-4", "* Last Name", "Primary contact last name"],
            ["1-06-5", "Suffix", "Primary contact suffix"],
            ["2-1-1", "Prefix", "Alternate contact prefix"],
            ["2-1-2", "* First Name", "Alternate contact first name"],
            ["2-1-3", "Middle Name", "Alternate contact middle name"],
            ["2-1-4", "* Last Name", "Alternate contact last name"],
            ["2-1-5", "Suffix", "Alternate contact suffix"],
            [
              "3-1-1",
              "Prefix",
              "Authorized Organization Representative prefix",
            ],
            [
              "3-1-2",
              "* First Name",
              "Authorized Organization Representative first name",
            ],
            [
              "3-1-3",
              "Middle Name",
              "Authorized Organization Representative middle name",
            ],
            [
              "3-1-4",
              "* Last Name",
              "Authorized Organization Representative last name",
            ],
            [
              "3-1-5",
              "Suffix",
              "Authorized Organization Representative suffix",
            ],
            ["4-1-1", "Prefix", "Federal Tax Matters contact prefix"],
            ["4-1-2", "* First Name", "Federal Tax Matters contact first name"],
            ["4-1-3", "Middle Name", "Federal Tax Matters contact middle name"],
            ["4-1-4", "* Last Name", "Federal Tax Matters contact last name"],
            ["4-1-5", "Suffix", "Federal Tax Matters contact suffix"],
            ["5-1-1", "Prefix", "Financial/PMS contact prefix"],
            ["5-1-2", "* First Name", "Financial/PMS contact first name"],
            ["5-1-3", "Middle Name", "Financial/PMS contact middle name"],
            ["5-1-4", "* Last Name", "Financial/PMS contact last name"],
            ["5-1-5", "Suffix", "Financial/PMS contact suffix"],
            ["6-1-1", "Prefix", "Other contact prefix"],
            ["6-1-2", "First Name", "Other contact first name"],
            ["6-1-3", "Middle Name", "Other contact middle name"],
            ["6-1-4", "Last Name", "Other contact last name"],
            ["6-1-5", "Suffix", "Other contact suffix"],
            [
              "6-6",
              "May the IRS share this other contact’s information with other grant recipients and non-grant recipients involved in the VITA or TCE program?",
              "May the IRS share the Alternate Contacts information with other grant recipients and non-grant recipients involved in the VITA or TCE program",
            ],
            ["7-1-1", "Prefix", "Other contact prefix"],
            ["7-1-2", "First Name", "Other contact first name"],
            ["7-1-3", "Middle Name", "Other contact middle name"],
            ["7-1-4", "Last Name", "Other contact last name"],
            ["7-1-5", "Suffix", "Other contact suffix"],
            [
              "7-6",
              "May the IRS share this other contact’s information with other grant recipients and non-grant recipients involved in the VITA or TCE program?",
              "May the IRS share the Alternate Contacts information with other grant recipients and non-grant recipients involved in the VITA or TCE program",
            ],
            ["8-1-1", "Prefix", "Other contact prefix"],
            ["8-1-2", "First Name", "Other contact first name"],
            ["8-1-3", "Middle Name", "Other contact middle name"],
            ["8-1-4", "Last Name", "Other contact last name"],
            ["8-1-5", "Suffix", "Other contact suffix"],
            [
              "8-6",
              "May the IRS share this other contact’s information with other grant recipients and non-grant recipients involved in the VITA or TCE program?",
              "May the IRS share the Alternate Contacts information with other grant recipients and non-grant recipients involved in the VITA or TCE program",
            ],
          ] as const
        ).map(([key, plan, source]) => [
          key,
          {
            category: "intentional" as const,
            reason:
              "Existing shared name/contact labels are disambiguated by the explicit source-named role heading. Other Contact sharing labels correct the copied Alternate Contacts wording; every source slot and independent permission answer remains separate.",
            plan,
            source,
          },
        ]),
      ),
    },
    differingHelp: {
      ...Object.fromEntries(
        (
          [
            [
              "1-02-1",
              "Enter the first line of the street address.",
              "Pre-populated from the SF 424. This field is required.",
            ],
            [
              "1-02-2",
              "Enter the second line of the street address.",
              "Pre-populated from the SF 424.",
            ],
            [
              "1-02-3",
              "Enter the city.",
              "Pre-populated from the SF 424. This field is required.",
            ],
            [
              "1-02-4",
              "US State or Territory Code",
              "Pre-populated from the SF 424. This field is required if Country is the United States.",
            ],
            ["1-02-5", "Enter the province.", "Pre-populated from the SF 424."],
            [
              "1-02-6",
              "Country Code",
              "Pre-populated from the SF 424. This field is required.",
            ],
            [
              "1-02-7",
              "Enter the zip / postal code.",
              "Pre-populated from the SF 424. This field is required if Country is the United States.",
            ],
            ["1-06-1", "Enter the prefix.", "Pre-populated from the SF 424."],
            [
              "1-06-2",
              "Enter the first name.",
              "Pre-populated from the SF 424. This field is required.",
            ],
            [
              "1-06-3",
              "Enter the middle name.",
              "Pre-populated from the SF 424.",
            ],
            [
              "1-06-4",
              "Enter the last name.",
              "Pre-populated from the SF 424. This field is required.",
            ],
            ["1-06-5", "Enter the suffix.", "Pre-populated from the SF 424."],
            [
              "1-07",
              "Enter the position title.",
              "Enter the primary contact title. This field is required.",
            ],
            [
              "1-08",
              "Enter the daytime telephone number.",
              "Pre-populated from the SF 424. This field is required.",
            ],
            [
              "1-09",
              "Enter the cell phone number.",
              "Enter the primary contact cell phone number.",
            ],
            [
              "1-10",
              "Enter a valid email address.",
              "Pre-populated from the SF 424. This field is required.",
            ],
            [
              "2-1-1",
              "Enter the prefix.",
              "Select the prefix of the alternate contact from the provided list or enter a new prefix not provided on the list.",
            ],
            [
              "2-1-2",
              "Enter the first name.",
              "Enter the alternate contact first name. This field is required.",
            ],
            [
              "2-1-3",
              "Enter the middle name.",
              "Enter the alternate contact middle name.",
            ],
            [
              "2-1-4",
              "Enter the last name.",
              "Enter the alternate contact last name. This field is required.",
            ],
            [
              "2-1-5",
              "Enter the suffix.",
              "Select the suffix of the alternate contact from the provided list or enter a new suffix not provided on the list.",
            ],
            [
              "2-2",
              "Enter the position title.",
              "Enter the alternate contact title. This field is required.",
            ],
            [
              "2-3",
              "Enter the daytime telephone number.",
              "Enter the alternate contact phone number. This field is required.",
            ],
            [
              "2-4",
              "Enter the cell phone number.",
              "Enter the alternate contact cell phone number.",
            ],
            [
              "2-5",
              "Enter a valid email address.",
              "Enter the alternate contact email address. This field is required.",
            ],
            ["3-1-1", "Enter the prefix.", "Pre-populated from the SF 424."],
            [
              "3-1-2",
              "Enter the first name.",
              "Pre-populated from the SF 424. This field is required.",
            ],
            [
              "3-1-3",
              "Enter the middle name.",
              "Pre-populated from the SF 424.",
            ],
            [
              "3-1-4",
              "Enter the last name.",
              "Pre-populated from the SF 424. This field is required.",
            ],
            ["3-1-5", "Enter the suffix.", "Pre-populated from the SF 424."],
            [
              "3-2",
              "Enter the position title.",
              "Pre-populated from the SF 424. This field is required.",
            ],
            [
              "3-3",
              "Enter the daytime telephone number.",
              "Pre-populated from the SF 424. This field is required.",
            ],
            [
              "3-5",
              "Enter a valid email address.",
              "Pre-populated from the SF 424. This field is required.",
            ],
            [
              "4-1-1",
              "Enter the prefix.",
              "Select the prefix of the federal tax matters contact from the provided list or enter a new prefix not provided on the list.",
            ],
            [
              "4-1-2",
              "Enter the first name.",
              "Enter the federal tax matters contact first name. This field is required.",
            ],
            [
              "4-1-3",
              "Enter the middle name.",
              "Enter the federal tax matters contact middle name.",
            ],
            [
              "4-1-4",
              "Enter the last name.",
              "Enter the federal tax matters contact last name. This field is required.",
            ],
            [
              "4-1-5",
              "Enter the suffix.",
              "Select the suffix of the federal tax matters contact from the provided list or enter a new suffix not provided on the list.",
            ],
            [
              "4-2",
              "Enter the position title.",
              "Enter the federal tax matters contact title. This field is required.",
            ],
            [
              "4-3",
              "Enter the daytime telephone number.",
              "Enter the federal tax matters contact phone number. This field is required.",
            ],
            [
              "4-4",
              "Enter the cell phone number.",
              "Enter the federal tax matters contact cell phone number.",
            ],
            [
              "4-5",
              "Enter a valid email address.",
              "Enter the federal tax matters contact email address. This field is required.",
            ],
            [
              "5-1-1",
              "Enter the prefix.",
              "Select the prefix of the financial/PMS contact from the provided list or enter a new prefix not provided on the list.",
            ],
            [
              "5-1-2",
              "Enter the first name.",
              "Enter the financial/PMS contact first name. This field is required.",
            ],
            [
              "5-1-3",
              "Enter the middle name.",
              "Enter the financial/PMS contact middle name.",
            ],
            [
              "5-1-4",
              "Enter the last name.",
              "Enter the financial/PMS contact last name. This field is required.",
            ],
            [
              "5-1-5",
              "Enter the suffix.",
              "Select the suffix of the financial/PMS contact from the provided list or enter a new suffix not provided on the list.",
            ],
            [
              "5-2",
              "Enter the position title.",
              "Enter the financial/PMS contact title. This field is required.",
            ],
            [
              "5-3",
              "Enter the daytime telephone number.",
              "Enter the financial/PMS contact phone number. This field is required.",
            ],
            [
              "5-4",
              "Enter the cell phone number.",
              "Enter the financial/PMS contact cell phone number.",
            ],
            [
              "5-5",
              "Enter a valid email address.",
              "Enter the financial/PMS contact email address. This field is required.",
            ],
            [
              "6-1-1",
              "Enter the prefix.",
              "Select the prefix of the other contact from the provided list or enter a new prefix not provided on the list.",
            ],
            [
              "6-1-2",
              "Enter the first name.",
              "Enter the Other contact first name.",
            ],
            [
              "6-1-3",
              "Enter the middle name.",
              "Enter the Other contact middle name.",
            ],
            [
              "6-1-4",
              "Enter the last name.",
              "Enter the Other contact last name.",
            ],
            [
              "6-1-5",
              "Enter the suffix.",
              "Select the suffix of the other contact from the provided list or enter a new suffix not provided on the list.",
            ],
            [
              "6-2",
              "Enter the position title.",
              "Enter the other contact title.",
            ],
            [
              "6-3",
              "Enter the daytime telephone number.",
              "Enter the other contact phone number.",
            ],
            [
              "6-4",
              "Enter the cell phone number.",
              "Enter the other contact cell phone number.",
            ],
            [
              "6-5",
              "Enter a valid email address.",
              "Enter the other contact email address.",
            ],
            [
              "7-1-1",
              "Enter the prefix.",
              "Select the prefix of the other contact from the provided list or enter a new prefix not provided on the list.",
            ],
            [
              "7-1-2",
              "Enter the first name.",
              "Enter the Other contact first name.",
            ],
            [
              "7-1-3",
              "Enter the middle name.",
              "Enter the Other contact middle name.",
            ],
            [
              "7-1-4",
              "Enter the last name.",
              "Enter the Other contact last name.",
            ],
            [
              "7-1-5",
              "Enter the suffix.",
              "Select the suffix of the other contact from the provided list or enter a new suffix not provided on the list.",
            ],
            [
              "7-2",
              "Enter the position title.",
              "Enter the other contact title.",
            ],
            [
              "7-3",
              "Enter the daytime telephone number.",
              "Enter the other contact phone number.",
            ],
            [
              "7-4",
              "Enter the cell phone number.",
              "Enter the other contact cell phone number.",
            ],
            [
              "7-5",
              "Enter a valid email address.",
              "Enter the other contact email address.",
            ],
            [
              "8-1-1",
              "Enter the prefix.",
              "Select the prefix of the other contact from the provided list or enter a new prefix not provided on the list.",
            ],
            [
              "8-1-2",
              "Enter the first name.",
              "Enter the Other contact first name.",
            ],
            [
              "8-1-3",
              "Enter the middle name.",
              "Enter the Other contact middle name.",
            ],
            [
              "8-1-4",
              "Enter the last name.",
              "Enter the Other contact last name.",
            ],
            [
              "8-1-5",
              "Enter the suffix.",
              "Select the suffix of the other contact from the provided list or enter a new suffix not provided on the list.",
            ],
            [
              "8-2",
              "Enter the position title.",
              "Enter the other contact title.",
            ],
            [
              "8-3",
              "Enter the daytime telephone number.",
              "Enter the other contact phone number.",
            ],
            [
              "8-4",
              "Enter the cell phone number.",
              "Enter the other contact cell phone number.",
            ],
            [
              "8-5",
              "Enter a valid email address.",
              "Enter the other contact email address.",
            ],
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
        (
          [
            ["PrimaryContact/Email/minLength", null, 1],
            ["AlternateContact/Email/minLength", null, 1],
            ["AOR/Email/minLength", null, 1],
            ["FederalTaxMattersContact/Email/minLength", null, 1],
            ["FinancialPMSContact/Email/minLength", null, 1],
            ["OtherContact1/Email/minLength", null, 1],
            ["OtherContact2/Email/minLength", null, 1],
            ["OtherContact3/Email/minLength", null, 1],
          ] as const
        ).map(([key, plan, source]) => [
          key,
          {
            category: "intentional" as const,
            reason:
              "The existing shared email question uses format email, which already rejects an empty string, rather than a redundant minLength error. MaxLength60 and source invalid-email instructions are preserved and tested with actual invalid/empty email cases.",
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
        (
          [
            ["primary_contact.email/minLength", null, 1],
            ["alternate_contact.email/minLength", null, 1],
            ["authorized_representative.email/minLength", null, 1],
            ["federal_tax_matters_contact.email/minLength", null, 1],
            ["financial_pms_contact.email/minLength", null, 1],
            ["other_contact1.email/minLength", null, 1],
            ["other_contact2.email/minLength", null, 1],
            ["other_contact3.email/minLength", null, 1],
          ] as const
        ).map(([key, plan, source]) => [
          key,
          {
            category: "intentional" as const,
            reason:
              "The existing shared email question uses format email, which already rejects an empty string, rather than a redundant minLength error. MaxLength60 and source invalid-email instructions are preserved and tested with actual invalid/empty email cases.",
            plan,
            source,
          },
        ]),
      ),
    },
  },
};
