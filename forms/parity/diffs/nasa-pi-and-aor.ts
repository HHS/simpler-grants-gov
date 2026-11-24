import type { FormDiff, Pinned } from "../harness/model.ts";
import {
  BUDGET_AMOUNT,
  conditionalStar,
  PREPOPULATED_HELP,
  RADIO_OPTIONS,
  SHARED_HELP,
  YES_NO_BOOLEAN,
} from "./common.ts";

const PREPOPULATED = "Pre-populated from the SF 424 (R&R).";

/** The name fields of one person, numbered from `block`-1, pinned to the bank's help. */
const nameHelp = (block: string): Record<string, Pinned> =>
  Object.fromEntries(
    ["prefix", "first name", "middle name", "last name", "suffix"].map(
      (part, index) => [
        `${block}-${index + 1}`,
        {
          ...PREPOPULATED_HELP,
          plan: `Enter the ${part}.`,
          source: PREPOPULATED,
        },
      ],
    ),
  );

const USERNAME_MIN_LENGTH: Pinned = {
  plan: null,
  source: 0,
  category: "intentional",
  reason:
    "The XSD sets UserName's minLength to 0, which allows any string. The form states no minimum.",
};

const AMOUNT = "PrincipalInvestigatorName/FederalAgencyDollar";
const AMOUNT_PATTERN = "^\\d{1,12}([.]\\d{2})?$";

export const DIFF: FormDiff = {
  slug: "nasa-pi-and-aor",
  dat: {
    absentFromPlan: {
      "3-6-1": RADIO_OPTIONS,
      "3-6-2": RADIO_OPTIONS,
      "3-9-1": RADIO_OPTIONS,
      "3-9-2": RADIO_OPTIONS,
    },
    differingLabels: {
      "3-7": conditionalStar("If yes, Select U.S. Government agency"),
    },
    differingHelp: {
      ...nameHelp("2"),
      ...nameHelp("3"),
      "2-6": {
        plan: "If registered with NSPIRES, enter your username.",
        source: "If registered with NSPIRES enter your username",
        category: "intentional",
        reason: "The form adds punctuation to the DAT's help.",
      },
      "3-6": {
        ...SHARED_HELP,
        plan: "Select Yes or No.",
        source: "A selection is required.",
      },
      "3-9": {
        ...SHARED_HELP,
        plan: "Select Yes or No.",
        source: "A selection is required.",
      },
    },
    differingRules: {
      "3-8/maxLength": { ...BUDGET_AMOUNT, plan: 15, source: null },
    },
  },
  xsd: {
    differingRules: {
      "AuthorizedRepresentativeName/UserName/minLength": USERNAME_MIN_LENGTH,
      [`${AMOUNT}/maxLength`]: { ...BUDGET_AMOUNT, plan: 15, source: null },
      [`${AMOUNT}/pattern`]: {
        ...BUDGET_AMOUNT,
        plan: AMOUNT_PATTERN,
        source: null,
      },
      [`${AMOUNT}/minimum`]: { ...BUDGET_AMOUNT, plan: null, source: 0 },
      [`${AMOUNT}/maximum`]: {
        ...BUDGET_AMOUNT,
        plan: null,
        source: 999999999999.99,
      },
    },
  },
  jsonSchemaVsXsd: {
    differingRules: {
      "authorized_representative.nspires_username/minLength":
        USERNAME_MIN_LENGTH,
      "principal_investigator.us_government_participation/enum": {
        ...YES_NO_BOOLEAN,
        plan: null,
        source: ["Y: Yes", "N: No"],
      },
      "principal_investigator.international_participation/enum": {
        ...YES_NO_BOOLEAN,
        plan: null,
        source: ["Y: Yes", "N: No"],
      },
      "principal_investigator.federal_agency_dollar/minimum": {
        ...BUDGET_AMOUNT,
        plan: null,
        source: 0,
      },
      "principal_investigator.federal_agency_dollar/maximum": {
        ...BUDGET_AMOUNT,
        plan: null,
        source: 999999999999.99,
      },
    },
  },
};
