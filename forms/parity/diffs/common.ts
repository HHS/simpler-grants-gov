import type { Pinned, Recorded, Wording } from "../harness/model.ts";

/** A label the form library standardized across forms, where this form's DAT words it differently. */
export const standardLabel = (plan: string, source: string): Pinned => ({
  plan,
  source,
  category: "intentional",
  reason:
    "Shared questions use one label across forms. The DATs word these fields several ways; the form library standardizes on the most common or clearest.",
});

/** Help text a shared question words once for every form, where this form's DAT words it differently. */
export const SHARED_HELP: Recorded = {
  category: "intentional",
  reason:
    "Shared questions use one help text across forms, written in the question bank, so it does not follow this DAT's wording: role names, “Please”, or “This field is required.” (the form marks required fields itself).",
};

/** Prefix and Suffix, which Grants.gov offers as a list and the form does not. */
export const FREE_TEXT_HELP: Recorded = {
  category: "intentional",
  reason:
    "Grants.gov offers a list of prefixes and suffixes alongside free text. The form uses a free-text field only, so its help does not mention a list.",
};

/** Labels and help text taken from the question bank rather than worded after the DAT. */
export const BANK_WORDING: Wording = {
  labels: {
    category: "intentional",
    reason:
      "The form takes its labels from the question bank, which words each question once for every form that asks it.",
  },
  help: {
    category: "intentional",
    reason:
      "The form takes its help text from the question bank, which words each question once for every form that asks it.",
  },
};

/** The DAT's address heading rows, which have no answer of their own. */
export const ADDRESS_HEADING: Recorded = {
  category: "upstream",
  reason:
    "The DAT numbers the Address heading as a field. It has no answer of its own and no element in the XSD; its fields follow it.",
};
