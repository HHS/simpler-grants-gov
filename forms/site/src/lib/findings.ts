/** Filtering the original public findings; no field/cell projection or deduplication. */
import type { Artifact, Finding } from "@parity/index.ts";

export type FindingCategory = Finding["status"];
export const FINDING_CATEGORIES: readonly FindingCategory[] = [
  "gap",
  "upstream",
  "intentional",
  "unrecorded",
  "stale",
];
export const ARTIFACT_LABELS: Record<Artifact, string> = {
  plan: "Plan",
  dat: "DAT",
  xsd: "XSD",
  jsonSchema: "JSON Schema",
  uiSchema: "UI schema",
  xmlMapping: "XML rules",
  differenceRecord: "Difference record",
  index: "Schema index",
};
const DIMENSION_LABELS: Record<string, string> = {
  missing: "Missing elements",
  extra: "Extra elements",
  label: "Label",
  help: "Help",
  required: "Required",
  order: "Position",
  minLength: "Minimum length",
  maxLength: "Maximum length",
  minimum: "Minimum",
  maximum: "Maximum",
  pattern: "Pattern",
  format: "Format",
  enum: "Options",
  enumType: "Option type",
  maxOccurs: "Repeat limit",
  namespace: "Namespace",
  record: "Difference record",
  presence: "Presence",
};
/** Preserve the direction of missing/extra elements instead of merging both into presence. */
export const findingDimension = (finding: Finding): string =>
  finding.kind === "missing from plan"
    ? "missing"
    : finding.kind === "missing from source"
      ? "extra"
      : finding.dimension;
export const findingDimensionLabel = (dimension: string): string =>
  DIMENSION_LABELS[dimension] ?? dimension;

/** OR within each group, AND between groups. Empty filters retain every original finding. */
export function visibleFindings(
  findings: readonly Finding[],
  categories: readonly FindingCategory[] = [],
  dimensions: readonly string[] = [],
): Finding[] {
  return findings.filter(
    (finding) =>
      (!categories.length || categories.includes(finding.status)) &&
      (!dimensions.length || dimensions.includes(findingDimension(finding))),
  );
}

/** Category totals respond only to dimension filters; selecting categories never hides a tile. */
export function findingCategoryCounts(
  findings: readonly Finding[],
  dimensions: readonly string[] = [],
) {
  const rows = visibleFindings(findings, [], dimensions);
  return FINDING_CATEGORIES.map((category) => ({
    category,
    count: rows.filter((f) => f.status === category).length,
  }));
}

/** Dimension totals respond only to categories; zero-count dimensions remain available to clear. */
export function findingDimensionCounts(
  findings: readonly Finding[],
  categories: readonly FindingCategory[] = [],
) {
  const rows = visibleFindings(findings, categories);
  return [...new Set(findings.map(findingDimension))].map((dimension) => ({
    dimension,
    count: rows.filter((f) => findingDimension(f) === dimension).length,
  }));
}
