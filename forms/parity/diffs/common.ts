import type { FormDiff, Pinned, Recorded, Wording } from "../harness/model.ts";

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

/** Attachments, which the XML transform rules cannot write yet. */
export const ATTACHMENT_XML: Recorded = {
  category: "gap",
  reason:
    "Each attachment sits in a wrapper element (e.g. BioSketchsAttached) with no field of its own, which the API's XML transform rules, keyed by the response's properties, cannot write. A rule format keyed by XML path would; until then the emitter leaves them out.",
};

/**
 * The XML registers for attachments the rules leave out, from each one's JSON path and element
 * path as the plan links them.
 */
export const unmappedAttachments = (
  links: [json: string, xml: string][],
): Pick<
  FormDiff,
  "xmlMapping" | "xmlMappingVsJsonSchema" | "xmlMappingVsXsd"
> => ({
  xmlMapping: {
    absentFromSource: Object.fromEntries(
      links.map(([json, xml]) => [`${json} -> ${xml}`, ATTACHMENT_XML]),
    ),
  },
  xmlMappingVsJsonSchema: {
    absentFromPlan: Object.fromEntries(
      links.map(([json]) => [json, ATTACHMENT_XML]),
    ),
  },
  xmlMappingVsXsd: {
    absentFromPlan: Object.fromEntries(
      links.map(([, xml]) => [xml, ATTACHMENT_XML]),
    ),
  },
});
