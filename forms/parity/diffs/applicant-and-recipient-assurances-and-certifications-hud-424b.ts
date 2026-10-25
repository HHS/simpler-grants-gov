import type { FormDiff } from "../harness/model.ts";

// Tuples are [source coordinate, proposed value, original source value].
// Every value remains pinned; source/plan changes still invalidate the record.
export const DIFF: FormDiff = {
  slug: "applicant-and-recipient-assurances-and-certifications-hud-424b",
  dat: {
    differingHelp: {
      ...Object.fromEntries(
        (
          [
            ["02-02-1", "Enter the prefix.", "Pre-populated from the SF-424."],
            [
              "02-02-2",
              "Enter the first name.",
              "Pre-populated from the SF-424.",
            ],
            [
              "02-02-3",
              "Enter the middle name.",
              "Pre-populated from the SF-424.",
            ],
            [
              "02-02-4",
              "Enter the last name.",
              "Pre-populated from the SF-424.",
            ],
            ["02-02-5", "Enter the suffix.", "Pre-populated from the SF-424."],
            [
              "02-03",
              "Enter the position title.",
              "Pre-populated from the SF-424.",
            ],
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
