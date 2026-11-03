import type { FormDiff, Recorded } from "../harness/model.ts";
import {
  ADDRESS_HEADING,
  BANK_WORDING,
  emailMinLength,
  PROFILE_GROUPS,
} from "./common.ts";

/** Key-person fields the DAT allows once, though the XSD allows 7 key persons. */
const ONCE: Recorded = {
  category: "upstream",
  reason:
    "The DAT gives the key person's name and address fields 1 occurrence. The XSD allows 7 key persons, as the DAT's other key-person fields do.",
};

/** Fields required within each key person, in a section the form can leave empty. */
const EACH_KEY_PERSON: Recorded = {
  category: "upstream",
  reason:
    "The DAT marks these required. The XSD requires them only for each key person entered, and key persons are optional.",
};

export const DIFF: FormDiff = {
  slug: "research-related-senior-key-person-profile",
  xml: "xml-mapping",
  wording: BANK_WORDING,
  dat: {
    absentFromPlan: { "1-10": ADDRESS_HEADING, "2-10": ADDRESS_HEADING },
    outOfOrder: {
      "1-07": PROFILE_GROUPS,
      "1-22": PROFILE_GROUPS,
      "1-23": PROFILE_GROUPS,
      "2-07": PROFILE_GROUPS,
      "2-22": PROFILE_GROUPS,
      "2-23": PROFILE_GROUPS,
    },
    differingRules: {
      "2-01/maxOccurs": { plan: 7, source: 1, ...ONCE },
      "2-02/maxOccurs": { plan: 7, source: 1, ...ONCE },
      "2-03/maxOccurs": { plan: 7, source: 1, ...ONCE },
      "2-04/maxOccurs": { plan: 7, source: 1, ...ONCE },
      "2-05/maxOccurs": { plan: 7, source: 1, ...ONCE },
      "2-11/maxOccurs": { plan: 7, source: 1, ...ONCE },
      "2-12/maxOccurs": { plan: 7, source: 1, ...ONCE },
      "2-13/maxOccurs": { plan: 7, source: 1, ...ONCE },
      "2-14/maxOccurs": { plan: 7, source: 1, ...ONCE },
      "2-15/maxOccurs": { plan: 7, source: 1, ...ONCE },
      "2-15a/maxOccurs": { plan: 7, source: 1, ...ONCE },
      "2-16/maxOccurs": { plan: 7, source: 1, ...ONCE },
      "2-17/maxOccurs": { plan: 7, source: 1, ...ONCE },
      "2-02/required": {
        plan: "conditional",
        source: "yes",
        ...EACH_KEY_PERSON,
      },
      "2-04/required": {
        plan: "conditional",
        source: "yes",
        ...EACH_KEY_PERSON,
      },
      "2-11/required": {
        plan: "conditional",
        source: "yes",
        ...EACH_KEY_PERSON,
      },
      "2-13/required": {
        plan: "conditional",
        source: "yes",
        ...EACH_KEY_PERSON,
      },
      "2-16/required": {
        plan: "conditional",
        source: "yes",
        ...EACH_KEY_PERSON,
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
