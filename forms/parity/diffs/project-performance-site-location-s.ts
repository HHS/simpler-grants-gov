import type { FormDiff } from "../harness/model.ts";

export const DIFF: FormDiff = {
  slug: "project-performance-site-location-s",
  dat: {
    differingLabels: {
      "1-07": {
        category: "intentional",
        reason:
          "The DAT prints an asterisk on a conditionally required field. The plan records the condition separately instead of making the asterisk part of its label or the answer unconditionally required. The source obligation is retained, not waived.",
        plan: "State",
        source: "* State",
      },
      "1-10": {
        category: "intentional",
        reason:
          "The DAT prints an asterisk on a conditionally required field. The plan records the condition separately instead of making the asterisk part of its label or the answer unconditionally required. The source obligation is retained, not waived.",
        plan: "Zip / Postal Code",
        source: "* ZIP / Postal Code",
      },
      "1-11": {
        category: "intentional",
        reason:
          "The DAT prints an asterisk on a conditionally required field. The plan records the condition separately instead of making the asterisk part of its label or the answer unconditionally required. The source obligation is retained, not waived.",
        plan: "Project/Performance Site Congressional District",
        source: "* Project/ Performance Site Congressional District",
      },
      "2-04": {
        category: "intentional",
        reason:
          "The DAT prints an asterisk on a conditionally required field. The plan records the condition separately instead of making the asterisk part of its label or the answer unconditionally required. The source obligation is retained, not waived.",
        plan: "Street1",
        source: "* Street1",
      },
      "2-06": {
        category: "intentional",
        reason:
          "The DAT prints an asterisk on a conditionally required field. The plan records the condition separately instead of making the asterisk part of its label or the answer unconditionally required. The source obligation is retained, not waived.",
        plan: "City",
        source: "* City",
      },
      "2-08": {
        category: "intentional",
        reason:
          "The DAT prints an asterisk on a conditionally required field. The plan records the condition separately instead of making the asterisk part of its label or the answer unconditionally required. The source obligation is retained, not waived.",
        plan: "State",
        source: "* State",
      },
      "2-09": {
        category: "intentional",
        reason:
          "The DAT prints an asterisk on a conditionally required field. The plan records the condition separately instead of making the asterisk part of its label or the answer unconditionally required. The source obligation is retained, not waived.",
        plan: "Country",
        source: "* Country",
      },
      "2-10": {
        category: "intentional",
        reason:
          "The DAT prints an asterisk on a conditionally required field. The plan records the condition separately instead of making the asterisk part of its label or the answer unconditionally required. The source obligation is retained, not waived.",
        plan: "Zip / Postal Code",
        source: "* ZIP / Postal Code",
      },
      "2-11": {
        category: "intentional",
        reason:
          "The DAT prints an asterisk on a conditionally required field. The plan records the condition separately instead of making the asterisk part of its label or the answer unconditionally required. The source obligation is retained, not waived.",
        plan: "Project/Performance Site Congressional District",
        source: "* Project/ Performance Site Congressional District",
      },
      "1-06": {
        plan: "County/Parish",
        source: "County",
        category: "intentional",
        reason:
          "Shared questions use one label across forms. The DATs word these fields several ways; the form library standardizes on the most common or clearest.",
      },
      "2-07": {
        plan: "County/Parish",
        source: "County",
        category: "intentional",
        reason:
          "Shared questions use one label across forms. The DATs word these fields several ways; the form library standardizes on the most common or clearest.",
      },
    },
    differingRules: {
      "1-0/maxOccurs": {
        category: "upstream",
        plan: 1,
        source: null,
        reason:
          "The primary-site checkbox DAT row leaves occurrences blank. The XSD has one PrimarySite with at most one Individual answer. The plan records that single answer; it does not infer a numeric DAT limit from the blank cell.",
      },
      "2-03/maxOccurs": {
        category: "upstream",
        plan: 299,
        source: 1,
        reason:
          "DAT Other Site UEI alone says maximum 1 while the site heading, neighboring fields and XSD OtherSite allow 299 sites, each with its own UEI. The plan follows the XSD/repeated-site scope and retains this source conflict for review.",
      },
    },
  },
  xsd: {
    differingRules: {
      "PrimarySite/CongressionalDistrictProgramProject/pattern": {
        category: "upstream",
        plan: "^[A-Z0-9]{2}-[A-Za-z0-9]{3}$",
        source: null,
        reason:
          "DAT 1-11/2-11 requires six characters with a hyphen third. The XSD restricts length but states no pattern. The plan preserves existing SGG at1858f9a6 character validation rather than broadening it; this stricter policy is proposed for review, not a runtime pass.",
      },
      "OtherSite/CongressionalDistrictProgramProject/pattern": {
        category: "upstream",
        plan: "^[A-Z0-9]{2}-[A-Za-z0-9]{3}$",
        source: null,
        reason:
          "DAT 1-11/2-11 requires six characters with a hyphen third. The XSD restricts length but states no pattern. The plan preserves existing SGG at1858f9a6 character validation rather than broadening it; this stricter policy is proposed for review, not a runtime pass.",
      },
    },
  },
  uiSchema: {
    differingLabels: {
      "primary_site.address.street1": {
        plan: "Street1",
        source: "Street 1",
        category: "intentional",
        reason:
          "Shared questions use one label across forms. The DATs word these fields several ways; the form library standardizes on the most common or clearest.",
      },
      "primary_site.address.street2": {
        plan: "Street2",
        source: "Street 2",
        category: "intentional",
        reason:
          "Shared questions use one label across forms. The DATs word these fields several ways; the form library standardizes on the most common or clearest.",
      },
      "primary_site.congressional_district": {
        plan: "Project/Performance Site Congressional District",
        source: "Congressional District",
        category: "intentional",
        reason:
          "Shared questions use one label across forms. The DATs word these fields several ways; the form library standardizes on the most common or clearest.",
      },
      "additional_sites[].address.street1": {
        plan: "Street1",
        source: "Street 1",
        category: "intentional",
        reason:
          "Shared questions use one label across forms. The DATs word these fields several ways; the form library standardizes on the most common or clearest.",
      },
      "additional_sites[].address.street2": {
        plan: "Street2",
        source: "Street 2",
        category: "intentional",
        reason:
          "Shared questions use one label across forms. The DATs word these fields several ways; the form library standardizes on the most common or clearest.",
      },
      "additional_sites[].congressional_district": {
        plan: "Project/Performance Site Congressional District",
        source: "Congressional District",
        category: "intentional",
        reason:
          "Shared questions use one label across forms. The DATs word these fields several ways; the form library standardizes on the most common or clearest.",
      },
      additional_locations_attachment: {
        plan: "Additional Location(s)",
        source: "Additional locations attachment",
        category: "intentional",
        reason:
          "Shared questions use one label across forms. The DATs word these fields several ways; the form library standardizes on the most common or clearest.",
      },
    },
    differingHelp: {
      "primary_site.organization_name": {
        category: "intentional",
        reason:
          "Shared questions use one help text across forms, written in the question bank, so it does not follow this DAT's wording: role names, “Please”, or “This field is required.” (the form marks required fields itself).",
        plan: "Indicate the organization name of the primary site where the work will be performed. If a portion of the project will be performed at any other sites(s), identify the site location(s) in the block(s) provided. (This field is not applicable for applicants using SF 424 Individual Form Set.)",
        source:
          "Indicate the organization name of the site where the work will be performed.",
      },
      "primary_site.address.street1": {
        category: "intentional",
        reason:
          "Shared questions use one help text across forms, written in the question bank, so it does not follow this DAT's wording: role names, “Please”, or “This field is required.” (the form marks required fields itself).",
        plan: 'Enter first line of the street address in "Street 1" field of the primary performance site location. This field is required.',
        source: "Enter the first line of the street address.",
      },
      "primary_site.address.street2": {
        category: "intentional",
        reason:
          "Shared questions use one help text across forms, written in the question bank, so it does not follow this DAT's wording: role names, “Please”, or “This field is required.” (the form marks required fields itself).",
        plan: 'Enter second line of the street address in "Street 2" field for the primary performance site location. This field is optional.',
        source: "Enter the second line of the street address.",
      },
      "primary_site.address.city": {
        category: "intentional",
        reason:
          "Shared questions use one help text across forms, written in the question bank, so it does not follow this DAT's wording: role names, “Please”, or “This field is required.” (the form marks required fields itself).",
        plan: "Enter the City for address of the primary performance site location. This field is required.",
        source: "Enter the city.",
      },
      "primary_site.address.county": {
        category: "intentional",
        reason:
          "Shared questions use one help text across forms, written in the question bank, so it does not follow this DAT's wording: role names, “Please”, or “This field is required.” (the form marks required fields itself).",
        plan: "Enter the County of the performance site location.",
        source: "Enter the county or parish.",
      },
      "primary_site.address.state": {
        category: "intentional",
        reason:
          "Shared questions use one help text across forms, written in the question bank, so it does not follow this DAT's wording: role names, “Please”, or “This field is required.” (the form marks required fields itself).",
        plan: "Enter the State where the primary performance site location is located. This field is required if the Project Performance Site is located in the United States.",
        source:
          "Select the state. This field is required if the country is the United States.",
      },
      "primary_site.address.province": {
        category: "intentional",
        reason:
          "Shared questions use one help text across forms, written in the question bank, so it does not follow this DAT's wording: role names, “Please”, or “This field is required.” (the form marks required fields itself).",
        plan: "Enter the Province where the primary performance site location is located.",
        source: "Enter the province.",
      },
      "primary_site.address.country": {
        category: "intentional",
        reason:
          "Shared questions use one help text across forms, written in the question bank, so it does not follow this DAT's wording: role names, “Please”, or “This field is required.” (the form marks required fields itself).",
        plan: "Select the country for the primary performance site location.",
        source: "Select the country.",
      },
      "primary_site.address.zip_code": {
        category: "gap",
        reason:
          "The DAT specifies nine-digit US ZIP guidance;existing SGG/general bank bounds permit shorter values. Candidate preserves current API admission. The source/consumer policy is unresolved;do not treat this comparison as source acceptance.",
        plan: "Enter the nine-digit Postal Code (e.g., ZIP code) of the primary performance site location. This field is required if the Project Performance Site is located in the United States.",
        source:
          "Enter the zip / postal code. This field is required if the country is the United States.",
      },
      "primary_site.congressional_district": {
        category: "intentional",
        reason:
          "Shared questions use one help text across forms, written in the question bank, so it does not follow this DAT's wording: role names, “Please”, or “This field is required.” (the form marks required fields itself).",
        plan: "Enter the Congressional District in the format: 2 character State Abbreviation - 3 character District Number. Examples: CA-005 for California's 5th district, CA-012 for California's 12th district. If all districts in a state are affected, enter \"all\" for the district number. Example: MD-all for all congressional districts in Maryland. If nationwide (all districts in all states), enter US-all. If the program/project is outside the US, enter 00-000. To locate your congressional district, visit the Grants.gov web site. Note it is likely that this field will be identical to the “Congressional Districts of Applicant” field provided elsewhere in this application.",
        source:
          "Enter the congressional district in the format **-***. This field is required for a US site.",
      },
      "additional_sites[].organization_name": {
        category: "intentional",
        reason:
          "Shared questions use one help text across forms, written in the question bank, so it does not follow this DAT's wording: role names, “Please”, or “This field is required.” (the form marks required fields itself).",
        plan: "Indicate the organization name of the primary site where the work will be performed. If a portion of the project will be performed at any other sites(s), identify the site location(s) in the block(s) provided. (This field is not applicable for applicants using SF 424 Individual Form Set.)",
        source:
          "Indicate the organization name of the site where the work will be performed.",
      },
      "additional_sites[].address.street1": {
        category: "intentional",
        reason:
          "Shared questions use one help text across forms, written in the question bank, so it does not follow this DAT's wording: role names, “Please”, or “This field is required.” (the form marks required fields itself).",
        plan: 'Enter first line of the street address in "Street 1" field of the primary performance site location. This field is required.',
        source: "Enter the first line of the street address.",
      },
      "additional_sites[].address.street2": {
        category: "intentional",
        reason:
          "Shared questions use one help text across forms, written in the question bank, so it does not follow this DAT's wording: role names, “Please”, or “This field is required.” (the form marks required fields itself).",
        plan: 'Enter second line of the street address in "Street 2" field for the primary performance site location. This field is optional.',
        source: "Enter the second line of the street address.",
      },
      "additional_sites[].address.city": {
        category: "intentional",
        reason:
          "Shared questions use one help text across forms, written in the question bank, so it does not follow this DAT's wording: role names, “Please”, or “This field is required.” (the form marks required fields itself).",
        plan: "Enter the City for address of the primary performance site location. This field is required.",
        source: "Enter the city.",
      },
      "additional_sites[].address.county": {
        category: "intentional",
        reason:
          "Shared questions use one help text across forms, written in the question bank, so it does not follow this DAT's wording: role names, “Please”, or “This field is required.” (the form marks required fields itself).",
        plan: "Enter the County of the performance site location.",
        source: "Enter the county or parish.",
      },
      "additional_sites[].address.state": {
        category: "intentional",
        reason:
          "Shared questions use one help text across forms, written in the question bank, so it does not follow this DAT's wording: role names, “Please”, or “This field is required.” (the form marks required fields itself).",
        plan: "Enter the State where the primary performance site location is located. This field is required if the Project Performance Site is located in the United States.",
        source:
          "Select the state. This field is required if the country is the United States.",
      },
      "additional_sites[].address.province": {
        category: "intentional",
        reason:
          "Shared questions use one help text across forms, written in the question bank, so it does not follow this DAT's wording: role names, “Please”, or “This field is required.” (the form marks required fields itself).",
        plan: "Enter the Province where the primary performance site location is located.",
        source: "Enter the province.",
      },
      "additional_sites[].address.country": {
        category: "intentional",
        reason:
          "Shared questions use one help text across forms, written in the question bank, so it does not follow this DAT's wording: role names, “Please”, or “This field is required.” (the form marks required fields itself).",
        plan: "Select the name of the country for the primary project performance site.",
        source: "Select the country.",
      },
      "additional_sites[].address.zip_code": {
        category: "gap",
        reason:
          "The DAT specifies nine-digit US ZIP guidance;existing SGG/general bank bounds permit shorter values. Candidate preserves current API admission. The source/consumer policy is unresolved;do not treat this comparison as source acceptance.",
        plan: "Enter the nine-digit Postal Code (e.g., ZIP code) of the primary performance site location. This field is required if the Project Performance Site is located in the United States.",
        source:
          "Enter the zip / postal code. This field is required if the country is the United States.",
      },
      "additional_sites[].congressional_district": {
        category: "intentional",
        reason:
          "Shared questions use one help text across forms, written in the question bank, so it does not follow this DAT's wording: role names, “Please”, or “This field is required.” (the form marks required fields itself).",
        plan: "Enter the Congressional District in the format: 2 character State Abbreviation - 3 character District Number. Examples: CA-005 for California's 5th district, CA-012 for California's 12th district. If all districts in a state are affected, enter \"all\" for the district number. Example: MD-all for all congressional districts in Maryland. If nationwide (all districts in all states), enter US-all. If the program/project is outside the US, enter 00-000. To locate your congressional district, visit the Grants.gov web site. Note it is likely that this field will be identical to the “Congressional Districts of Applicant” field provided elsewhere in this application.",
        source:
          "Enter the congressional district in the format **-***. This field is required for a US site.",
      },
      additional_locations_attachment: {
        category: "intentional",
        reason:
          "The source overflow obligation remains,with explicit299-entry activation. The preview explains UUID-reference-only behavior;upload,attachment ownership and actual submission are not claimed.",
        plan: "Attach a file using the appropriate buttons.",
        source:
          "If more than 299 additional sites exist, attach a file listing additional locations. The preview accepts an illustrative upload UUID; no file content, existence or ownership is verified.",
      },
    },
  },
  jsonSchemaVsXsd: {
    differingRules: {
      "primary_site.submitting_as_individual/enum": {
        category: "intentional",
        reason:
          "Current SGG stores this answer as boolean. The existing XML boolean_to_yes_no transform supplies the source coded Y/N string. This difference records transport representation;no candidate XML mapping or submission is introduced.",
        plan: null,
        source: ["Y: Yes", "N: No"],
      },
      "additional_sites[].submitting_as_individual/enum": {
        category: "intentional",
        reason:
          "Current SGG stores this answer as boolean. The existing XML boolean_to_yes_no transform supplies the source coded Y/N string. This difference records transport representation;no candidate XML mapping or submission is introduced.",
        plan: null,
        source: ["Y: Yes", "N: No"],
      },
    },
  },
};
