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

/** A DAT that asks for a nine-digit ZIP code, where the form accepts any length. */
export const NINE_DIGIT_ZIP: Recorded = {
  category: "gap",
  reason:
    "The DAT asks for a nine-digit ZIP code, but the question bank accepts any length, as SGG's existing forms do, so `20001` is valid. The form keeps accepting what the API accepts today. Whether to require ZIP+4 is still undecided.",
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

/** Labels and help kept from the existing SGG forms with a single attachment list. */
export const SGG_ATTACHMENT_WORDING: Wording = {
  labels: {
    category: "intentional",
    reason:
      "The form keeps the existing SGG form's label for its attachment list.",
  },
  help: {
    category: "intentional",
    reason:
      "The form keeps the existing SGG form's help for its attachment list.",
  },
};

/** The DAT's additional-file control, which the form folds into its attachment list. */
export const ADDITIONAL_FILES: Recorded = {
  category: "intentional",
  reason:
    "The DAT has a separate control for additional files. The form puts them in the same list as the required file, as the existing SGG form does.",
};

/** Compare the required-file control with the limit on the combined list. */
export const attachmentListMax = (max: number): Pinned => ({
  plan: max,
  source: 1,
  category: "intentional",
  reason: `The DAT's 1 is for the required-file control. The list holds that file and any additional files, up to the XSD's limit of ${max}.`,
});

/** The DAT's address heading rows, which have no answer of their own. */
export const ADDRESS_HEADING: Recorded = {
  category: "upstream",
  reason:
    "The DAT numbers the Address heading as a field. It has no answer of its own and no element in the XSD; its fields follow it.",
};

/** Fields the key-person forms' groups place differently from the DAT. */
export const PROFILE_GROUPS: Recorded = {
  category: "intentional",
  reason:
    "Every key-person form lays a profile out in the same groups: Name, Role, Address, Contact Information, Credentials, Attachments. Role puts the organization before the department and the project role after the division, where the DAT lists them elsewhere.",
};

/** Email fields, which leave out the XSD's minimum length. */
export const EMAIL_MIN_LENGTH: Pinned = {
  plan: null,
  source: 1,
  category: "intentional",
  reason:
    "globLib:EmailDataType has a minLength of 1. Email fields leave it out, as the API's hand-written forms do: format email already rejects an empty string, and two errors for the same problem is confusing.",
};

/** `differingRules` entries recording `EMAIL_MIN_LENGTH` for each email field's path. */
export const emailMinLength = (paths: string[]): Record<string, Pinned> =>
  Object.fromEntries(
    paths.map((path) => [`${path}/minLength`, EMAIL_MIN_LENGTH]),
  );

/** A DAT that stars a field its Required column marks optional, because a condition requires it. */
export const conditionalStar = (label: string, source = label): Pinned => ({
  plan: label,
  source: `* ${source}`,
  category: "upstream",
  reason:
    "The DAT stars this field but its Required column says No: the field is required only when a condition the DAT states is met. The plan marks it conditional, so its label has no star.",
});

/** Yes/No answers, which the form stores as booleans. */
export const YES_NO_BOOLEAN: Recorded = {
  category: "intentional",
  reason:
    "The form stores this answer as a boolean. The XML mapping's boolean_to_yes_no transform writes the XSD's “Y: Yes” or “N: No”.",
};

/** The DAT's Yes and No radio buttons, which the plan lists as one answer. */
export const RADIO_OPTIONS: Recorded = {
  category: "upstream",
  reason:
    "The DAT lists each radio button as a field of its own. The plan lists the question once, with a Yes/No answer.",
};

/** Dollar amounts, which the form stores as strings. */
export const BUDGET_AMOUNT: Recorded = {
  category: "intentional",
  reason:
    "globLib:BudgetAmountDataType is a decimal from 0 to 999999999999.99. The form stores the amount as a string of up to 12 digits with optional cents, as the API's budget forms do, so no amount is rounded. The XML mapping's currency_format transform writes it with two decimal places.",
};

/** Help that only says the DAT pre-populates the field from another form. */
export const PREPOPULATED_HELP: Recorded = {
  category: "intentional",
  reason:
    "The DAT's help only says the field is pre-populated from the SF 424 (R&R). The form doesn't pre-populate it yet, so it uses the question bank's help.",
};
