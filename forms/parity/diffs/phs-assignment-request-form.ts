import type { FormDiff, Pinned } from "../harness/model.ts";

const slotLabel = (plan: string, source: string | null = null): Pinned => ({
  plan,
  source,
  category: "intentional",
  reason:
    "The DAT leaves numbered slots unlabeled or uses instructions as the field label. The plan gives each control an explicit accessible label and preserves the source instructions in the section help.",
});

export const DIFF: FormDiff = {
  slug: "phs-assignment-request-form",
  dat: {
    differingLabels: {
      "A-2-2": slotLabel("Suggested awarding component 1"),
      "A-2-3": slotLabel("Suggested awarding component 2"),
      "A-2-4": slotLabel("Suggested awarding component 3"),
      "A-3-2": slotLabel("Suggested study section 1"),
      "A-3-3": slotLabel("Suggested study section 2"),
      "A-3-4": slotLabel("Suggested study section 3"),
      "A-4-1": slotLabel(
        "Rationale for assignment suggestions",
        "Explain why you think the suggestions are appropriate. If you contacted NIH staff, list their name(s). Entry is limited to 1000 characters.",
      ),
      "A-5-2": slotLabel("Scientific expertise 1"),
      "A-5-3": slotLabel("Scientific expertise 2"),
      "A-5-4": slotLabel("Scientific expertise 3"),
      "A-5-5": slotLabel("Scientific expertise 4"),
      "A-5-6": slotLabel("Scientific expertise 5"),
      "A-6-1": slotLabel(
        "Individuals who should not review and why",
        "Entry is limited to 1000 characters",
      ),
    },
  },
  xsd: {
    differingRules: Object.fromEntries(
      [1, 2, 3].map((slot) => [
        `SuggestedStudySection${slot}/pattern`,
        {
          plan: "^[^\\x20()\\-]*$",
          source: null,
          category: "intentional",
          reason:
            "DAT A-3-0 and the PDF instruct applicants to remove spaces, hyphens and parentheses. The candidate enforces exactly that lexical instruction without changing the answer or inventing an external code list; the XSD states only length bounds.",
        } satisfies Pinned,
      ]),
    ),
  },
};
