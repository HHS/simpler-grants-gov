import type { FormDiff } from "../harness/model.ts";

// Tuples are [source coordinate, proposed value, original source value].
// Every value remains pinned; source/plan changes still invalidate the record.
export const DIFF: FormDiff = {
  slug: "hud-50153",
  dat: {
    differingLabels: {
      ...Object.fromEntries(
        (
          [
            ["1-1", "* Applicant Name:", "Applicant Name"],
            [
              "1-2-1",
              "Number of the Federal Program to which the applicant is applying:",
              "Number of the Federal Program to which the applicant is applying",
            ],
            [
              "1-2-2",
              "Name of the Federal Program to which the applicant is applying:",
              "Name of the Federal Program to which the applicant is applying",
            ],
            [
              "1-3",
              "* Name of the Promise Zone Designated Community:",
              "Name of the Promise Zone Designated Community",
            ],
            [
              "2-0",
              "* The proposed project meets the following geographic criteria (please select one):",
              "The proposed project meets the following geographic criteria (please select one)",
            ],
            ["5-1-2", "* First Name", "First Name"],
            ["5-1-4", "* Last Name", "Last Name"],
            ["5-2", "* Title:", "Title"],
            ["5-3", "* Organization:", "Organization"],
            ["5-4", "* Signature:", "Signature"],
            ["5-5", "* Date:", "Date"],
          ] as const
        ).map(([key, plan, source]) => [
          key,
          {
            category: "intentional" as const,
            reason:
              "Required markers, punctuation or whitespace differ in presentation only. The source field, meaning, requiredness and value remain unchanged.",
            plan,
            source,
          },
        ]),
      ),
    },
    differingHelp: {
      ...Object.fromEntries(
        (
          [
            [
              "2-0",
              "Select one option from the provided list. Within Boundries — The proposed project is solely within Promise Zone boundaries. Includes Zone — The proposed project includes the entire Promise Zone boundary and other communities. Includes Portion — The proposed project includes a portion of the Promise Zone boundary. Delivers Benefits — The proposed project is outside of the Promise Zone boundaries, but specific and definable services or benefits will be delivered within the Promise Zone or to Promise Zone residents.",
              "Select one option from the provided list.",
            ],
          ] as const
        ).map(([key, plan, source]) => [
          key,
          {
            category: "intentional" as const,
            reason:
              "Expose the complete original source choice meanings/instructions alongside the existing coded answer or a shorter field label. This is source wording relocation/addition for legibility; it does not invent a value, lookup, classification or calculation.",
            plan,
            source,
          },
        ]),
      ),
      ...Object.fromEntries(
        (
          [
            ["5-1-1", "Enter the prefix.", "Pre-populated from the SF-424."],
            [
              "5-1-2",
              "Enter the first name.",
              "Pre-populated from the SF-424.",
            ],
            [
              "5-1-3",
              "Enter the middle name.",
              "Pre-populated from the SF-424.",
            ],
            ["5-1-4", "Enter the last name.", "Pre-populated from the SF-424."],
            ["5-1-5", "Enter the suffix.", "Pre-populated from the SF-424."],
          ] as const
        ).map(([key, plan, source]) => [
          key,
          {
            category: "intentional" as const,
            reason:
              "Reuse established question/part help. The role heading, readonly schema/controls and plan pre_populated values retain exact source ownership; original source-specific instructions remain available in the pinned DAT and plan context. No new signing or automatic population behavior is implied.",
            plan,
            source,
          },
        ]),
      ),
    },
  },
};
