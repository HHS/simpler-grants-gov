import type { FormDiff } from "../harness/model.ts";
import {
  ADDRESS_HEADING,
  BANK_WORDING,
  emailMinLength,
  unmappedAttachments,
  PROFILE_GROUPS,
} from "./common.ts";

export const DIFF: FormDiff = {
  slug: "research-and-related-senior-key-person-profile-expanded",
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
      "principal_investigator.profile.email",
      "senior_key_persons[].profile.email",
    ]),
  },
  ...unmappedAttachments([
    [
      "principal_investigator.profile.biographical_sketch",
      "PDPI/Profile/BioSketchsAttached/BioSketchAttached",
    ],
    [
      "principal_investigator.profile.current_pending_support",
      "PDPI/Profile/SupportsAttached/SupportAttached",
    ],
    [
      "senior_key_persons[].profile.biographical_sketch",
      "KeyPerson/Profile/BioSketchsAttached/BioSketchAttached",
    ],
    [
      "senior_key_persons[].profile.current_pending_support",
      "KeyPerson/Profile/SupportsAttached/SupportAttached",
    ],
    [
      "additional_profiles",
      "AdditionalProfilesAttached/AdditionalProfileAttached",
    ],
    [
      "additional_biographical_sketches",
      "BioSketchsAttached/BioSketchAttached",
    ],
    ["additional_current_pending_support", "SupportsAttached/SupportAttached"],
  ]),
};
