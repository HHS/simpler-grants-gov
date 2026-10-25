import type { FormDiff } from "../harness/model.ts";

// Tuples are [source coordinate, proposed value, original source value].
// Every value remains pinned; source/plan changes still invalidate the record.
export const DIFF: FormDiff = {
  slug: "ach-vendor-miscellaneous-payment-enrollment-form",
  dat: {
    differingLabels: {
      ...Object.fromEntries(
        (
          [
            ["3-01", "* Agency Name:", "Agency Name"],
            ["3-02", "Agency Identifier:", "Agency Identifier"],
            [
              "3-03",
              "Agency Location Code (ALC):",
              "Agency Location Code (ALC)",
            ],
            ["3-04", "ACH Format:", "ACH Format"],
            ["3-06", "Street 1", "Street1"],
            ["3-07", "Street 2", "Street2"],
            ["3-20", "Telephone Number:", "Telephone Number"],
            ["3-21", "Additional Information:", "Additional Information"],
            [
              "4-01",
              "* Organization Name (Legal Name):",
              "Organization Name (Legal Name)",
            ],
            [
              "4-02",
              "* SSN No. or Taxpayer ID No.:",
              "SSN No. or Taxpayer ID No.",
            ],
            ["4-03", "* Street 1", "Street1"],
            ["4-04", "Street 2", "Street2"],
            ["4-05", "* City", "City"],
            ["4-09", "* Country", "Country"],
            ["4-13", "* First Name", "First Name"],
            ["4-15", "* Last Name", "Last Name"],
            ["4-17", "* Telephone Number:", "Telephone Number"],
            [
              "5-01",
              "* Name of Financial Institution:",
              "Name of Financial Institution",
            ],
            ["5-02", "* Street 1", "Street1"],
            ["5-03", "Street 2", "Street2"],
            ["5-04", "* City", "City"],
            ["5-08", "* Country", "Country"],
            ["5-12", "* First Name", "First Name"],
            ["5-14", "* Last Name", "Last Name"],
            ["5-16", "* Telephone Number:", "Telephone Number"],
            [
              "5-17",
              "* Nine-Digit Routing Transit Number:",
              "Nine-Digit Routing Transit Number",
            ],
            ["5-18", "* Depositor Account Title:", "Depositor Account Title"],
            ["5-19", "* Depositor Account Number:", "Depositor Account Number"],
            ["5-20", "Lockbox Number:", "Lockbox Number"],
            ["5-21", "Type of Account:", "Type of Account"],
            ["5-24", "* First Name", "First Name"],
            ["5-26", "* Last Name", "Last Name"],
            [
              "5-28",
              "* Title of Authorized Official:",
              "Title of Authorized Official",
            ],
            ["5-29", "* Telephone Number:", "Telephone Number"],
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
            ["3-09", "County/Parish", "County"],
            ["4-06", "County/Parish", "County"],
            ["5-05", "County/Parish", "County"],
          ] as const
        ).map(([key, plan, source]) => [
          key,
          {
            category: "intentional" as const,
            reason:
              "Reuse the established name/address part label under the explicit source role/section, or render the source-required marker. Every original source coordinate and source-specific instruction is retained; no ownership or validation change follows from the label.",
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
              "3-06",
              "Enter the first line of the street address.",
              "To be completed by Agency.",
            ],
            [
              "3-07",
              "Enter the second line of the street address.",
              "To be completed by Agency.",
            ],
            ["3-08", "Enter the city.", "To be completed by Agency."],
            [
              "3-09",
              "Enter the county or parish.",
              "To be completed by Agency.",
            ],
            [
              "3-10",
              "Select the state. This field is required if the country is the United States.",
              "To be completed by Agency.",
            ],
            ["3-11", "Enter the province.", "To be completed by Agency."],
            ["3-12", "Select the country.", "To be completed by Agency."],
            [
              "3-13",
              "Enter the zip / postal code. This field is required if the country is the United States.",
              "To be completed by Agency.",
            ],
            ["3-15", "Enter the prefix.", "To be completed by Agency."],
            ["3-16", "Enter the first name.", "To be completed by Agency."],
            ["3-17", "Enter the middle name.", "To be completed by Agency."],
            ["3-18", "Enter the last name.", "To be completed by Agency."],
            ["3-19", "Enter the suffix.", "To be completed by Agency."],
            [
              "4-03",
              "Enter the first line of the street address.",
              "Enter the first line of the Street Address. This field is required.",
            ],
            [
              "4-05",
              "Enter the city.",
              "Enter the City. This field is required.",
            ],
            ["4-06", "Enter the county or parish.", "Enter the County."],
            [
              "4-07",
              "Select the state. This field is required if the country is the United States.",
              "Select the state, US possession or military code from the provided list. This field is required if Country is the United States.",
            ],
            [
              "4-09",
              "Select the country.",
              "Select the Country from the provided list. This field is required.",
            ],
            [
              "4-10",
              "Enter the zip / postal code. This field is required if the country is the United States.",
              "Enter the Postal Code (e.g., ZIP code). This field is required if Country is the United States.",
            ],
            [
              "4-12",
              "Enter the prefix.",
              "Select the Prefix from the provided list or enter a new Prefix not provided on the list.",
            ],
            [
              "4-13",
              "Enter the first name.",
              "Enter the First Name. This field is required.",
            ],
            [
              "4-15",
              "Enter the last name.",
              "Enter the Last Name. This field is required.",
            ],
            [
              "4-16",
              "Enter the suffix.",
              "Select the Suffix from the provided list or enter a new Suffix not provided on the list.",
            ],
            [
              "5-02",
              "Enter the first line of the street address.",
              "Enter the first line of the Street Address. This field is required.",
            ],
            [
              "5-04",
              "Enter the city.",
              "Enter the City. This field is required.",
            ],
            ["5-05", "Enter the county or parish.", "Enter the County."],
            [
              "5-06",
              "Select the state. This field is required if the country is the United States.",
              "Select the state, US possession or military code from the provided list. This field is required if Country is the United States.",
            ],
            [
              "5-08",
              "Select the country.",
              "Select the Country from the provided list. This field is required.",
            ],
            [
              "5-09",
              "Enter the zip / postal code. This field is required if the country is the United States.",
              "Enter the Postal Code (e.g., ZIP code). This field is required if Country is the United States.",
            ],
            [
              "5-11",
              "Enter the prefix.",
              "Select the Prefix from the provided list or enter a new Prefix not provided on the list.",
            ],
            [
              "5-12",
              "Enter the first name.",
              "Enter the First Name. This field is required.",
            ],
            [
              "5-14",
              "Enter the last name.",
              "Enter the Last Name. This field is required.",
            ],
            [
              "5-15",
              "Enter the suffix.",
              "Select the Suffix from the provided list or enter a new Suffix not provided on the list.",
            ],
            [
              "5-23",
              "Enter the prefix.",
              "Select the Prefix from the provided list or enter a new Prefix not provided on the list.",
            ],
            [
              "5-24",
              "Enter the first name.",
              "Enter the First Name. This field is required.",
            ],
            [
              "5-26",
              "Enter the last name.",
              "Enter the Last Name. This field is required.",
            ],
            [
              "5-27",
              "Enter the suffix.",
              "Select the Suffix from the provided list or enter a new Suffix not provided on the list.",
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
            ["AgencyLocation/pattern", "^[0-9]*$", null],
            [
              "FinancialInstitution/NineDigitRoutingTransitNumber/pattern",
              "^[0-9]{9}$",
              null,
            ],
            [
              "FinancialInstitution/DepositorAccountNumber/pattern",
              "^[0-9]+$",
              null,
            ],
          ] as const
        ).map(([key, plan, source]) => [
          key,
          {
            category: "intentional" as const,
            reason:
              "DAT K specifies Numeric digits only for this identifier while the original XSD states string length. Preserve a string and leading zeros, adding only the declared ASCII-digit pattern. No number conversion, checksum, financial verification or bank service is invented.",
            plan,
            source,
          },
        ]),
      ),
    },
  },
};
