import type { FormDiff } from "../harness/model.ts";
import {
  ADDRESS_HEADING,
  BANK_WORDING,
  conditionalStar,
  EACH_ENTRY_REQUIRED,
  emailMinLength,
  ENTRY_OCCURRENCES,
  entryStar,
  PROFILE_GROUPS,
} from "./common.ts";

export const DIFF: FormDiff = {
  slug: "research-related-senior-key-person-profile",
  xml: "xml-mapping",
  wording: BANK_WORDING,
  dat: {
    absentFromPlan: { "1-10": ADDRESS_HEADING, "2-10": ADDRESS_HEADING },
    differingLabels: {
      "1-15": conditionalStar("State"),
      "1-17": conditionalStar("Zip / Postal Code"),
      "2-02": entryStar("First Name"),
      "2-04": entryStar("Last Name"),
      "2-11": entryStar("Street 1", "Street1"),
      "2-13": entryStar("City"),
      "2-15": conditionalStar("State"),
      "2-16": entryStar("Country"),
      "2-17": conditionalStar("Zip / Postal Code"),
      "2-18": entryStar("Phone Number"),
      "2-20": entryStar("Email", "E-Mail"),
      "2-22": entryStar("Project Role"),
      "2-24": entryStar("Biographical Sketch", "Attach Biographical Sketch"),
    },
    outOfOrder: {
      "1-07": PROFILE_GROUPS,
      "1-22": PROFILE_GROUPS,
      "1-23": PROFILE_GROUPS,
      "2-07": PROFILE_GROUPS,
      "2-22": PROFILE_GROUPS,
      "2-23": PROFILE_GROUPS,
    },
    differingRules: {
      "2-01/maxOccurs": { plan: 7, source: 1, ...ENTRY_OCCURRENCES },
      "2-02/maxOccurs": { plan: 7, source: 1, ...ENTRY_OCCURRENCES },
      "2-03/maxOccurs": { plan: 7, source: 1, ...ENTRY_OCCURRENCES },
      "2-04/maxOccurs": { plan: 7, source: 1, ...ENTRY_OCCURRENCES },
      "2-05/maxOccurs": { plan: 7, source: 1, ...ENTRY_OCCURRENCES },
      "2-11/maxOccurs": { plan: 7, source: 1, ...ENTRY_OCCURRENCES },
      "2-12/maxOccurs": { plan: 7, source: 1, ...ENTRY_OCCURRENCES },
      "2-13/maxOccurs": { plan: 7, source: 1, ...ENTRY_OCCURRENCES },
      "2-14/maxOccurs": { plan: 7, source: 1, ...ENTRY_OCCURRENCES },
      "2-15/maxOccurs": { plan: 7, source: 1, ...ENTRY_OCCURRENCES },
      "2-15a/maxOccurs": { plan: 7, source: 1, ...ENTRY_OCCURRENCES },
      "2-16/maxOccurs": { plan: 7, source: 1, ...ENTRY_OCCURRENCES },
      "2-17/maxOccurs": { plan: 7, source: 1, ...ENTRY_OCCURRENCES },
      "2-02/required": {
        plan: "conditional",
        source: "yes",
        ...EACH_ENTRY_REQUIRED,
      },
      "2-04/required": {
        plan: "conditional",
        source: "yes",
        ...EACH_ENTRY_REQUIRED,
      },
      "2-11/required": {
        plan: "conditional",
        source: "yes",
        ...EACH_ENTRY_REQUIRED,
      },
      "2-13/required": {
        plan: "conditional",
        source: "yes",
        ...EACH_ENTRY_REQUIRED,
      },
      "2-16/required": {
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
