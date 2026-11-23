import type { FormDiff } from "../harness/model.ts";
import {
  ADDRESS_HEADING,
  BANK_WORDING,
  conditionalStar,
  emailMinLength,
  entryStar,
  PROFILE_GROUPS,
} from "./common.ts";

export const DIFF: FormDiff = {
  slug: "research-and-related-senior-key-person-profile-expanded",
  xml: "xml-mapping",
  wording: BANK_WORDING,
  dat: {
    absentFromPlan: { "1-10": ADDRESS_HEADING, "2-10": ADDRESS_HEADING },
    differingLabels: {
      "1-15": conditionalStar("State"),
      "1-17": conditionalStar("Zip / Postal Code", "ZIP / Postal Code"),
      "2-02": entryStar("First Name"),
      "2-04": entryStar("Last Name"),
      "2-11": entryStar("Street 1", "Street1"),
      "2-13": entryStar("City"),
      "2-15": conditionalStar("State"),
      "2-16": entryStar("Country"),
      "2-17": conditionalStar("Zip / Postal Code", "ZIP / Postal Code"),
      "2-18": entryStar("Phone Number"),
      "2-20": entryStar("Email", "E-Mail"),
      "2-22": entryStar("Project Role"),
    },
    outOfOrder: {
      "1-07": PROFILE_GROUPS,
      "1-22": PROFILE_GROUPS,
      "1-23": PROFILE_GROUPS,
      "2-07": PROFILE_GROUPS,
      "2-22": PROFILE_GROUPS,
      "2-23": PROFILE_GROUPS,
    },
  },
  xsd: {
    differingRules: {
      "PDPI/Profile/BioSketchsAttached/BioSketchAttached/required": {
        plan: "yes",
        source: "no",
        category: "upstream",
        reason:
          "The DAT requires the PD/PI's biographical sketch (1-26); the XSD makes every sketch optional. The form follows the DAT.",
      },
      ...emailMinLength(["PDPI/Profile/Email", "KeyPerson/Profile/Email"]),
    },
  },
  jsonSchemaVsXsd: {
    differingRules: emailMinLength([
      "principal_investigator.email",
      "senior_key_persons[].email",
    ]),
  },
};
