import type { FormDiff, Recorded } from "../harness/model.ts";
import {
  ADDRESS_HEADING,
  BANK_WORDING,
  conditionalStar,
  EACH_ENTRY_REQUIRED,
  emailMinLength,
  ENTRY_OCCURRENCES,
  entryStar,
  NINE_DIGIT_ZIP,
  PROFILE_GROUPS,
  unstarredRequired,
} from "./common.ts";

/** NSF ID's length, which the XSD sets with a pattern. */
const NSF_ID_LENGTH: Recorded = {
  category: "upstream",
  reason:
    "The DAT gives NSF ID a maximum of 9 characters. The XSD sets its length with the pattern [0-9A-Z]{9} and states no maximum, and the plan follows the XSD.",
};

export const DIFF: FormDiff = {
  slug: "nsf-senior-key-person-profile-expanded",
  xml: "xml-mapping",
  wording: BANK_WORDING,
  dat: {
    absentFromPlan: { "1-10": ADDRESS_HEADING, "2-10": ADDRESS_HEADING },
    differingLabels: {
      "1-15": conditionalStar("State"),
      "1-17": conditionalStar("Zip / Postal Code"),
      "1-28": unstarredRequired(
        "Current & Pending Support",
        "Attach Current & Pending (Other) Support",
      ),
      "2-02": entryStar("First Name"),
      "2-04": entryStar("Last Name"),
      "2-08": conditionalStar("Organization UEI", "Organization UEI ID"),
      "2-11": entryStar("Street 1", "Street1"),
      "2-13": entryStar("City"),
      "2-15": conditionalStar("State"),
      "2-16": entryStar("Country"),
      "2-17": conditionalStar("Zip / Postal Code"),
      "2-18": entryStar("Phone Number"),
      "2-20": entryStar("Email", "E-Mail"),
      "2-21": entryStar("Project Role"),
      "2-29": entryStar(
        "Collaborators & Other Affiliations",
        "Attach Collaborators & Other Affiliations",
      ),
      "2-30": entryStar(
        "Synergistic Activities",
        "Attach Synergistic Activities",
      ),
    },
    differingHelp: {
      "1-17": {
        plan: "Enter the zip / postal code. This field is required if the country is the United States.",
        source:
          "Pre-populated from the SF 424 (R&R). The nine-digit ZIP code (or ZIP+4) of Project Director. This field is required if the Project Director is located in the United States.",
        ...NINE_DIGIT_ZIP,
      },
      "2-17": {
        plan: "Enter the zip / postal code. This field is required if the country is the United States.",
        source:
          "Enter the nine-digit ZIP code (or ZIP+4) of Senior/Key Person. This field is required if the Senior/Key Person is located in the United States.",
        ...NINE_DIGIT_ZIP,
      },
    },
    outOfOrder: {
      "1-07": PROFILE_GROUPS,
      "1-21": PROFILE_GROUPS,
      "2-07": PROFILE_GROUPS,
      "2-21": PROFILE_GROUPS,
    },
    differingRules: {
      "1-23/maxLength": { plan: null, source: 9, ...NSF_ID_LENGTH },
      "2-23/maxLength": { plan: null, source: 9, ...NSF_ID_LENGTH },
      "2-23/maxOccurs": { plan: 99, source: 1, ...ENTRY_OCCURRENCES },
      "2-30/maxOccurs": { plan: 99, source: 1, ...ENTRY_OCCURRENCES },
      "2-30/required": {
        plan: "conditional",
        source: "yes",
        ...EACH_ENTRY_REQUIRED,
      },
    },
  },
  xsd: {
    differingRules: emailMinLength([
      "PDPI/Profile/Email",
      "KeyPerson/Profile/Email",
    ]),
  },
  jsonSchemaVsXsd: {
    differingRules: emailMinLength([
      "principal_investigator.email",
      "senior_key_persons[].email",
    ]),
  },
};
