import type { FormDiff } from "../harness/model.ts";

/** Shared name help remains distinct from source population ownership. */
export const DIFF: FormDiff = {
  slug: "usda-ad-1047",
  dat: {
    differingLabels: Object.fromEntries(
      [
        ["3-1", "ORGANIZATION NAME"],
        ["3-2", "PR/AWARD NUMBER OR PROJECT NAME"],
        ["4-3", "First Name"],
        ["4-5", "Last Name"],
        ["4-7", "Title"],
        ["5-1", "SIGNATURE(S)"],
        ["5-2", "DATE"],
      ].map(([slot, label]) => [
        slot,
        {
          plan: `* ${label}`,
          source: label,
          category: "intentional" as const,
          reason:
            "The library visibly marks required values; the DAT marks Required Yes but does not print an asterisk in these labels.",
        },
      ]),
    ),

    differingHelp: {
      "4-2": {
        plan: "Enter the prefix.",
        source: "Pre-populated from the Application cover sheet.",
        category: "intentional",
        reason:
          "The existing PersonName question keeps shared field help; cover-sheet ownership and non-editability are retained on the parent, source population metadata and layout context.",
      },
      "4-3": {
        plan: "Enter the first name.",
        source:
          "Pre-populated from the Application cover sheet. This field is required.",
        category: "intentional",
        reason:
          "The existing PersonName question keeps shared field help; cover-sheet ownership and non-editability are retained on the parent, source population metadata and layout context.",
      },
      "4-4": {
        plan: "Enter the middle name.",
        source: "Pre-populated from the Application cover sheet.",
        category: "intentional",
        reason:
          "The existing PersonName question keeps shared field help; cover-sheet ownership and non-editability are retained on the parent, source population metadata and layout context.",
      },
      "4-5": {
        plan: "Enter the last name.",
        source:
          "Pre-populated from the Application cover sheet. This field is required.",
        category: "intentional",
        reason:
          "The existing PersonName question keeps shared field help; cover-sheet ownership and non-editability are retained on the parent, source population metadata and layout context.",
      },
      "4-6": {
        plan: "Enter the suffix.",
        source: "Pre-populated from the Application cover sheet.",
        category: "intentional",
        reason:
          "The existing PersonName question keeps shared field help; cover-sheet ownership and non-editability are retained on the parent, source population metadata and layout context.",
      },
    },
  },
};
