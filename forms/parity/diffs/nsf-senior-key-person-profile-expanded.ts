import type { FormDiff, Recorded } from "../harness/model.ts";
import {
  ADDRESS_HEADING,
  BANK_WORDING,
  emailMinLength,
  NINE_DIGIT_ZIP,
  unmappedAttachments,
  PROFILE_GROUPS,
} from "./common.ts";

/** Key-person fields the DAT allows once, though the XSD allows 99 key persons. */
const ONCE: Recorded = {
  category: "upstream",
  reason:
    "The DAT gives this key-person field 1 occurrence. The XSD allows 99 key persons, as the DAT's other key-person fields do.",
};

/** NSF ID's length, which the XSD sets with a pattern. */
const NSF_ID_LENGTH: Recorded = {
  category: "upstream",
  reason:
    "The DAT gives NSF ID a maximum of 9 characters. The XSD sets its length with the pattern [0-9A-Z]{9} and states no maximum, and the plan follows the XSD.",
};

export const DIFF: FormDiff = {
  slug: "nsf-senior-key-person-profile-expanded",
  wording: BANK_WORDING,
  dat: {
    absentFromPlan: { "1-10": ADDRESS_HEADING, "2-10": ADDRESS_HEADING },
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
      "2-23/maxOccurs": { plan: 99, source: 1, ...ONCE },
      "2-30/maxOccurs": { plan: 99, source: 1, ...ONCE },
      "2-30/required": {
        plan: "conditional",
        source: "yes",
        category: "upstream",
        reason:
          "The DAT marks Synergistic Activities required. The XSD requires it only for each key person entered, and key persons are optional.",
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
      "principal_investigator.profile.collaborators",
      "PDPI/Profile/CollaboratorsAttached/CollaboratorAttached",
    ],
    [
      "principal_investigator.profile.synergistic_activities",
      "PDPI/Profile/SynergisticActivitiesAttached/SynergisticAttached",
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
      "senior_key_persons[].profile.collaborators",
      "KeyPerson/Profile/CollaboratorsAttached/CollaboratorAttached",
    ],
    [
      "senior_key_persons[].profile.synergistic_activities",
      "KeyPerson/Profile/SynergisticActivitiesAttached/SynergisticAttached",
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
    ["additional_collaborators", "CollaboratorsAttached/CollaboratorAttached"],
    [
      "additional_synergistic_activities",
      "SynergisticActivitiesAttached/SynergisticAttached",
    ],
  ]),
};
