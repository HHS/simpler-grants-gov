/** Finite DAT cells for one repeated answer; these coordinates never become answer data. */
import type { PlanField, MaxItems } from "./harness/flatten/plan.ts";
import { fromXmlPath, type Discrepancy } from "./harness/model.ts";

export interface SourceBindings {
  at: string;
  dat: { kind: "slot"; path: string; index: number }[];
}
export interface SourceCoordinate {
  path: string;
  maxItems: MaxItems;
  owner?: string;
  index?: number;
}

/** Preserve legacy coordinates. Explicit slots must cover their one finite array exactly. */
export function sourceCoordinates(
  field: PlanField,
  maxItems: MaxItems,
  source: "dat" | "xsd",
  problems: Discrepancy[] = [],
): SourceCoordinate[] {
  const shorthand = source === "dat" ? field.dat_field : field.xml_path;
  const binding = source === "dat" ? field.source_bindings : undefined;
  if (!binding)
    return shorthand
      ? [
          {
            path: source === "xsd" ? fromXmlPath(shorthand) : shorthand,
            maxItems,
          },
        ]
      : [];
  const path = field.json_path,
    owner = binding.at;
  const valid =
    !shorthand &&
    typeof path === "string" &&
    typeof owner === "string" &&
    owner.length > 0 &&
    !owner.includes("[]") &&
    path.startsWith(owner + "[].") &&
    (path.match(/\[\]/g)?.length ?? 0) === 1 &&
    typeof maxItems === "number" &&
    Number.isSafeInteger(maxItems) &&
    maxItems > 0 &&
    Array.isArray(binding.dat) &&
    binding.dat.length === maxItems &&
    binding.dat.every(
      (b) =>
        b.kind === "slot" &&
        typeof b.path === "string" &&
        b.path.trim() !== "" &&
        Number.isSafeInteger(b.index) &&
        b.index >= 0 &&
        b.index < maxItems,
    ) &&
    new Set(binding.dat.map((b) => b.index)).size === maxItems &&
    new Set(binding.dat.map((b) => b.path)).size === maxItems;
  if (!valid) {
    problems.push({
      kind: "source binding invalid",
      path: path ?? field.label,
      detail:
        "DAT slots must cover exactly one finite repeated owner, without shorthand, duplicate paths or indices",
    });
    return [];
  }
  return binding.dat.map((b) => ({
    path: b.path,
    owner,
    index: b.index,
    maxItems: 1,
  }));
}
