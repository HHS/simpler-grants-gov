/** Label for forms that aren't part of any Grants.gov form family (e.g. agency-specific forms). */
export const NO_FAMILY = "No family";

/**
 * The Grants.gov form families a form belongs to, or `[NO_FAMILY]` when it has none, so
 * filtering, counting and grouping treat unassigned forms as one family of their own.
 */
export const familiesOf = (form: { family: string[] }): string[] =>
  form.family.length ? form.family : [NO_FAMILY];

/** Sort families alphabetically, with `NO_FAMILY` last. */
export const byFamily = (a: string, b: string): number =>
  Number(a === NO_FAMILY) - Number(b === NO_FAMILY) || a.localeCompare(b);

/** CSS-safe slug for a family's badge class, e.g. "R&R" -> "r-r", "SF-424 Short" -> "sf-424-short". */
export const familySlug = (family: string): string =>
  family
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
