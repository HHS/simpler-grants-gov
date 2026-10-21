/** One completed record per existing check. No comparison or waiver policy is defined here. */
import {
  comparePair,
  matchFields,
  type Pair,
  type PairSpec,
  type PairResult,
} from "./compare.ts";
import type { CheckName, Finding, Artifact } from "../result.ts";
import type { Fields, Renamed } from "./model.ts";

/** Producer-owned completed checks; not part of the consumer contract. */
export interface CompletedCheck {
  name: CheckName;
  title: string;
  artifacts: { plan: Artifact; source: Artifact };
  plan: Fields;
  source: Fields;
  matched: Map<string, string>;
  renames: Record<string, Renamed>;
  coverage: Set<string>;
  result: PairResult;
  findings: Finding[];
}

const ARTIFACTS = {
  dat: ["plan", "dat", "Plan vs DAT"],
  xsd: ["plan", "xsd", "Plan vs XSD"],
  jsonSchema: ["plan", "jsonSchema", "Plan vs JSON Schema"],
  uiSchema: ["plan", "uiSchema", "Plan vs UI schema"],
  jsonSchemaVsXsd: ["jsonSchema", "xsd", "JSON Schema vs XSD"],
  xmlMapping: ["plan", "xmlMapping", "Plan vs XML links"],
  xmlMappingVsJsonSchema: [
    "xmlMapping",
    "jsonSchema",
    "XML rules vs JSON Schema",
  ],
  xmlMappingVsXsd: ["xmlMapping", "xsd", "XML rules vs XSD"],
} as const;

/** A shared semantic dimension, independent of a table's display-row grouping. */
function dimension(kind: string): string {
  if (kind === "missing from plan" || kind === "missing from source")
    return "presence";
  if (kind === "out of order") return "order";
  if (kind === "requiredness differs") return "required";
  if (kind === "stale entry") return "record";
  return kind.replace(/ differs$/, "");
}

export function evaluateCheck(
  name: CheckName,
  pair: Pair,
  spec: PairSpec,
  sourcePaths?: ReadonlyMap<string, string>,
): CompletedCheck {
  const result = comparePair(pair, spec);
  const matched = matchFields(pair);
  const [planArtifact, sourceArtifact, title] = ARTIFACTS[name];
  const artifacts = { plan: planArtifact, source: sourceArtifact };
  const coverage = new Set<string>();
  if (spec.fields !== false) coverage.add("presence");
  if (spec.order) coverage.add("order");
  if (spec.labels) coverage.add("label");
  if (spec.help) coverage.add("help");
  if (spec.constraints) {
    coverage.add("required");
    spec.constraints.keywords.forEach((keyword) => coverage.add(keyword));
  }
  if (spec.occurrences) coverage.add("maxOccurs");
  const sourcePath = (key: string) => sourcePaths?.get(key) ?? key;
  const findings: Finding[] = [];
  for (const [collection, rows] of Object.entries(result) as [
    keyof PairResult,
    PairResult[keyof PairResult],
  ][]) {
    for (const d of rows) {
      const entry = "entry" in d ? d.entry : undefined;
      const status =
        collection === "stale" ? "stale" : (entry?.category ?? "unrecorded");
      const anchors =
        d.kind === "stale entry"
          ? [{ artifact: "differenceRecord" as const, path: d.path }]
          : d.kind === "missing from plan"
            ? [{ artifact: sourceArtifact, path: sourcePath(d.path) }]
            : d.kind === "missing from source"
              ? [{ artifact: planArtifact, path: d.path }]
              : [
                  { artifact: planArtifact, path: d.path },
                  ...(matched.has(d.path)
                    ? [
                        {
                          artifact: sourceArtifact,
                          path: sourcePath(matched.get(d.path)!),
                        },
                      ]
                    : []),
                ];
      findings.push({
        ...d,
        id: `${name}:${findings.length}`,
        check: name,
        checkTitle: title,
        status,
        dimension: dimension(d.kind),
        anchors,
      });
    }
  }
  return {
    name,
    title,
    artifacts,
    plan: pair.plan,
    source: pair.source,
    matched,
    renames: pair.registers.renamed ?? {},
    coverage,
    result,
    findings,
  };
}
