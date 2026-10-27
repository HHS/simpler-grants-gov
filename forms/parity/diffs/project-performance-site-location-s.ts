import type { FormDiff, Pinned, Recorded } from "../harness/model.ts";
import { NINE_DIGIT_ZIP, SHARED_HELP, standardLabel } from "./common.ts";

/** The DAT stars a field the form requires only for a site in the United States. */
const conditionalStar = (label: string, source = label): Pinned => ({
  plan: label,
  source: `* ${source}`,
  category: "upstream",
  reason:
    "The DAT stars this field but marks it not required, and its help text requires it only for a site in the United States. The plan treats it as conditional, so it does not star it.",
});

/** The DAT stars a field each additional site requires, though additional sites are optional. */
const siteStar = (label: string, source = label): Pinned => ({
  plan: label,
  source: `* ${source}`,
  category: "upstream",
  reason:
    "The DAT stars this field for an additional site. Additional sites are optional, so the plan requires it only within a site that is added, and does not star it.",
});

const ORGANIZATION_HELP: Recorded = {
  category: "intentional",
  reason:
    "The form uses the help text of SGG's existing form, which leaves out the DAT's notes on other sites and on the SF 424 Individual form set.",
};

const DISTRICT_HELP: Recorded = {
  category: "intentional",
  reason:
    "The form uses the help text of SGG's existing form, which keeps the DAT's format and examples (CA-005, MD-all, US-all, 00-000) without its longer explanation.",
};

const ATTACHMENT_HELP: Recorded = {
  category: "intentional",
  reason:
    "The form uses the help text of SGG's existing form, which says when to attach the file. The DAT only says to use the buttons.",
};

/** Every help text that differs from the DAT, pinned word for word. */
const help: Record<string, Pinned> = {
  "1-01": {
    ...ORGANIZATION_HELP,
    plan: "Indicate the organization name of the site where the work will be performed.",
    source:
      "Indicate the organization name of the primary site where the work will be performed. If a portion of the project will be performed at any other sites(s), identify the site location(s) in the block(s) provided. (This field is not applicable for applicants using SF 424 Individual Form Set.)",
  },
  "1-03": {
    ...SHARED_HELP,
    plan: "Enter the first line of the street address.",
    source:
      'Enter first line of the street address in "Street 1" field of the primary performance site location. This field is required.',
  },
  "1-04": {
    ...SHARED_HELP,
    plan: "Enter the second line of the street address.",
    source:
      'Enter second line of the street address in "Street 2" field for the primary performance site location. This field is optional.',
  },
  "1-05": {
    ...SHARED_HELP,
    plan: "Enter the city.",
    source:
      "Enter the City for address of the primary performance site location. This field is required.",
  },
  "1-06": {
    ...SHARED_HELP,
    plan: "Enter the county or parish.",
    source: "Enter the County of the performance site location.",
  },
  "1-07": {
    ...SHARED_HELP,
    plan: "Select the state. This field is required if the country is the United States.",
    source:
      "Enter the State where the primary performance site location is located. This field is required if the Project Performance Site is located in the United States.",
  },
  "1-08": {
    ...SHARED_HELP,
    plan: "Enter the province.",
    source:
      "Enter the Province where the primary performance site location is located.",
  },
  "1-09": {
    ...SHARED_HELP,
    plan: "Select the country.",
    source: "Select the country for the primary performance site location.",
  },
  "1-10": {
    ...NINE_DIGIT_ZIP,
    plan: "Enter the zip / postal code. This field is required if the country is the United States.",
    source:
      "Enter the nine-digit Postal Code (e.g., ZIP code) of the primary performance site location. This field is required if the Project Performance Site is located in the United States.",
  },
  "1-11": {
    ...DISTRICT_HELP,
    plan: "Enter the Congressional District in the format: 2 character State Abbreviation - 3 character District Number. Examples: CA-005, MD-all, US-all, 00-000. Required if the site is in the United States.",
    source:
      "Enter the Congressional District in the format: 2 character State Abbreviation - 3 character District Number. Examples: CA-005 for California's 5th district, CA-012 for California's 12th district. If all districts in a state are affected, enter \"all\" for the district number. Example: MD-all for all congressional districts in Maryland. If nationwide (all districts in all states), enter US-all. If the program/project is outside the US, enter 00-000. To locate your congressional district, visit the Grants.gov web site. Note it is likely that this field will be identical to the “Congressional Districts of Applicant” field provided elsewhere in this application.",
  },
  "2-02": {
    ...ORGANIZATION_HELP,
    plan: "Indicate the organization name of the site where the work will be performed.",
    source:
      "Indicate the organization name of the primary site where the work will be performed. If a portion of the project will be performed at any other sites(s), identify the site location(s) in the block(s) provided. (This field is not applicable for applicants using SF 424 Individual Form Set.)",
  },
  "2-04": {
    ...SHARED_HELP,
    plan: "Enter the first line of the street address.",
    source:
      'Enter first line of the street address in "Street 1" field of the primary performance site location. This field is required.',
  },
  "2-05": {
    ...SHARED_HELP,
    plan: "Enter the second line of the street address.",
    source:
      'Enter second line of the street address in "Street 2" field for the primary performance site location. This field is optional.',
  },
  "2-06": {
    ...SHARED_HELP,
    plan: "Enter the city.",
    source:
      "Enter the City for address of the primary performance site location. This field is required.",
  },
  "2-07": {
    ...SHARED_HELP,
    plan: "Enter the county or parish.",
    source: "Enter the County of the performance site location.",
  },
  "2-08": {
    ...SHARED_HELP,
    plan: "Select the state. This field is required if the country is the United States.",
    source:
      "Enter the State where the primary performance site location is located. This field is required if the Project Performance Site is located in the United States.",
  },
  "2-08a": {
    ...SHARED_HELP,
    plan: "Enter the province.",
    source:
      "Enter the Province where the primary performance site location is located.",
  },
  "2-09": {
    ...SHARED_HELP,
    plan: "Select the country.",
    source:
      "Select the name of the country for the primary project performance site.",
  },
  "2-10": {
    ...NINE_DIGIT_ZIP,
    plan: "Enter the zip / postal code. This field is required if the country is the United States.",
    source:
      "Enter the nine-digit Postal Code (e.g., ZIP code) of the primary performance site location. This field is required if the Project Performance Site is located in the United States.",
  },
  "2-11": {
    ...DISTRICT_HELP,
    plan: "Enter the Congressional District in the format: 2 character State Abbreviation - 3 character District Number. Examples: CA-005, MD-all, US-all, 00-000. Required if the site is in the United States.",
    source:
      "Enter the Congressional District in the format: 2 character State Abbreviation - 3 character District Number. Examples: CA-005 for California's 5th district, CA-012 for California's 12th district. If all districts in a state are affected, enter \"all\" for the district number. Example: MD-all for all congressional districts in Maryland. If nationwide (all districts in all states), enter US-all. If the program/project is outside the US, enter 00-000. To locate your congressional district, visit the Grants.gov web site. Note it is likely that this field will be identical to the “Congressional Districts of Applicant” field provided elsewhere in this application.",
  },
  "3-3": {
    ...ATTACHMENT_HELP,
    plan: "Attach a file listing additional locations if more than 299 additional sites are needed.",
    source: "Attach a file using the appropriate buttons.",
  },
};

const DISTRICT_PATTERN: Recorded = {
  category: "intentional",
  reason:
    "The XSD limits the congressional district to 6 characters but sets no pattern. The form keeps SGG's existing pattern, which matches the DAT's format: two characters, a hyphen and three characters.",
};

const INDIVIDUAL_YES_NO: Recorded = {
  category: "intentional",
  reason:
    "The form stores this answer as a boolean. The XML mapping's boolean_to_yes_no transform writes the XSD's “Y: Yes” or “N: No”.",
};

export const DIFF: FormDiff = {
  slug: "project-performance-site-location-s",
  dat: {
    differingLabels: {
      "1-03": standardLabel("* Street 1", "* Street1"),
      "1-04": standardLabel("Street 2", "Street2"),
      "1-06": standardLabel("County/Parish", "County"),
      "1-07": conditionalStar("State"),
      "1-10": conditionalStar("Zip / Postal Code", "ZIP / Postal Code"),
      "1-11": conditionalStar(
        "Project/Performance Site Congressional District",
        "Project/ Performance Site Congressional District",
      ),
      "2-04": siteStar("Street 1", "Street1"),
      "2-05": standardLabel("Street 2", "Street2"),
      "2-06": siteStar("City"),
      "2-07": standardLabel("County/Parish", "County"),
      "2-08": conditionalStar("State"),
      "2-09": siteStar("Country"),
      "2-10": conditionalStar("Zip / Postal Code", "ZIP / Postal Code"),
      "2-11": conditionalStar(
        "Project/Performance Site Congressional District",
        "Project/ Performance Site Congressional District",
      ),
    },
    differingHelp: help,
    differingRules: {
      "1-0/maxOccurs": {
        plan: 1,
        source: null,
        category: "upstream",
        reason:
          "The DAT gives the primary site's individual checkbox no occurrences. The XSD allows one Individual per site, and so does the plan.",
      },
      "2-03/maxOccurs": {
        plan: 299,
        source: 1,
        category: "upstream",
        reason:
          "The DAT gives an additional site's UEI 1 occurrence, though it and the XSD allow 299 additional sites, each with its own UEI.",
      },
    },
  },
  xsd: {
    differingRules: {
      "PrimarySite/CongressionalDistrictProgramProject/pattern": {
        plan: "^[A-Z0-9]{2}-[A-Za-z0-9]{3}$",
        source: null,
        ...DISTRICT_PATTERN,
      },
      "OtherSite/CongressionalDistrictProgramProject/pattern": {
        plan: "^[A-Z0-9]{2}-[A-Za-z0-9]{3}$",
        source: null,
        ...DISTRICT_PATTERN,
      },
    },
  },
  jsonSchemaVsXsd: {
    differingRules: {
      "primary_site.submitting_as_individual/enum": {
        plan: null,
        source: ["Y: Yes", "N: No"],
        ...INDIVIDUAL_YES_NO,
      },
      "additional_sites[].submitting_as_individual/enum": {
        plan: null,
        source: ["Y: Yes", "N: No"],
        ...INDIVIDUAL_YES_NO,
      },
    },
  },
};
