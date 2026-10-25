import type { FormDiff } from "../harness/model.ts";

// Tuples are [source coordinate, proposed value, original source value].
// Every value remains pinned; source/plan changes still invalidate the record.
export const DIFF: FormDiff = {
  slug: "fra-f-30",
  dat: {
    differingLabels: {
      ...Object.fromEntries(
        (
          [
            ["02-B-1-1", "Place of Performance 1", null],
            ["02-B-1-2", "Place of Performance 2", null],
            ["02-B-1-3", "Place of Performance 3", null],
            [
              "02-B-2",
              "Check if there are workplaces on file that are not identified here.",
              "Check",
            ],
            [
              "03-0-1",
              "Check if the award or loan threshold in Part C applies",
              "CHECK",
            ],
          ] as const
        ).map(([key, plan, source]) => [
          key,
          {
            category: "intentional" as const,
            reason:
              "The source supplies a blank or terse Check label. The plan uses the exact adjacent workplace/threshold instructions or identifies the fixed source text slot. It adds no address structure, eligibility calculation or independent answer.",
            plan,
            source,
          },
        ]),
      ),
      ...Object.fromEntries(
        (
          [
            [
              "03-2-5-1",
              "* SIGNATURE OF AUTHORIZED CERTIFYING OFFICIAL",
              "SIGNATURE OF AUTHORIZED CERTIFYING OFFICIAL",
            ],
            ["03-2-5-2", "* TYPED NAME AND TITLE", "TYPED NAME AND TITLE"],
            ["03-2-5-3", "* DATE", "DATE"],
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
  },
};
