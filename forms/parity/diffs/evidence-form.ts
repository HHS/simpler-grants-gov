import type { FormDiff } from "../harness/model.ts";

export const DIFF: FormDiff = {
  slug: "evidence-form",
  dat: {
    differingLabels: {
      "2-3-1": {
        category: "intentional",
        plan: "* A. Research/Citation",
        source: null,
        reason:
          "DAT cells have empty labels; PDF/DAT column headings name the three answers. Repeat that context for legibility and state completion requiredness separately.",
      },
      "2-3-2": {
        category: "intentional",
        plan: "* B. Relevant Outcome(s)/Relevant Finding(s)",
        source: null,
        reason:
          "DAT cells have empty labels; PDF/DAT column headings name the three answers. Repeat that context for legibility and state completion requiredness separately.",
      },
      "2-3-3": {
        category: "intentional",
        plan: "* C. Project Component(s)/Overlap of Populations and/or Settings",
        source: null,
        reason:
          "DAT cells have empty labels; PDF/DAT column headings name the three answers. Repeat that context for legibility and state completion requiredness separately.",
      },
      "1-1": {
        category: "upstream",
        plan: "* Select the level of evidence of effectiveness for which you are applying. See the Notice Inviting Applications for the relevant definitions and requirements.",
        source:
          "Select the level of evidence of effectiveness for which you are applying. See the Notice Inviting Applications for the relevant definitions and requirements.",
        reason:
          "DAT Required? and One selection is required require this answer, although the label prints no asterisk. The plan preserves requiredness and the exact source choice values.",
      },
    },
    differingRules: {
      "2-3-1/required": {
        category: "upstream",
        plan: "yes",
        source: "no",
        reason:
          "DAT Required? says No, but its business rule requires one entry and all cells once a row has data. XSD requires each of the three values in 1\u2013100 Citations rows. Plan states complete-row/transmitted requirements; four visually blank starter rows do not become four required answers.",
      },
      "2-3-2/required": {
        category: "upstream",
        plan: "yes",
        source: "no",
        reason:
          "DAT Required? says No, but its business rule requires one entry and all cells once a row has data. XSD requires each of the three values in 1\u2013100 Citations rows. Plan states complete-row/transmitted requirements; four visually blank starter rows do not become four required answers.",
      },
      "2-3-3/required": {
        category: "upstream",
        plan: "yes",
        source: "no",
        reason:
          "DAT Required? says No, but its business rule requires one entry and all cells once a row has data. XSD requires each of the three values in 1\u2013100 Citations rows. Plan states complete-row/transmitted requirements; four visually blank starter rows do not become four required answers.",
      },
    },
  },
};
