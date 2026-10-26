/** Finite source slots for one repeated answer; coordinates never become answer data. */
import type { PlanField, MaxItems } from "./harness/flatten/plan.ts";
import { fromXmlPath, type Discrepancy } from "./harness/model.ts";

export type SourceBindings =
  | { at: string; dat?: Slot[]; xml?: Slot[] }
  | { dat: { kind: "choice"; path: string; value: string }[] };
type Slot = { kind: "slot"; path: string; index: number };
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
  const binding = field.source_bindings;
  const rows =
    binding &&
    (source === "dat"
      ? binding.dat
      : "at" in binding
        ? binding.xml
        : undefined);
  if (!binding || !rows)
    return shorthand
      ? [
          {
            path: source === "xsd" ? fromXmlPath(shorthand) : shorthand,
            maxItems,
          },
        ]
      : [];
  if (!("at" in binding)) {
    const rows = binding.dat;
    const valid =
      !shorthand &&
      Boolean(field.json_path) &&
      !field.json_path!.includes("[]") &&
      maxItems === 1 &&
      Array.isArray(rows) &&
      rows.length > 0 &&
      rows.every(
        (b) =>
          b.kind === "choice" &&
          typeof b.path === "string" &&
          b.path.trim() !== "" &&
          typeof b.value === "string" &&
          b.value.trim() !== "",
      ) &&
      new Set(rows.map((b) => b.path)).size === rows.length &&
      new Set(rows.map((b) => b.value)).size === rows.length;
    if (!valid) {
      problems.push({
        kind: "source binding invalid",
        path: field.json_path ?? field.label,
        detail:
          "DAT choices require unique controls and code values for one scalar answer, without shorthand",
      });
      return [];
    }
    return rows.map((b) => ({ path: b.path, maxItems: 1 }));
  }
  const slots = (source === "dat" ? binding.dat : binding.xml)!;
  const path = field.json_path,
    owner = binding.at;
  const valid =
    !shorthand &&
    typeof path === "string" &&
    typeof owner === "string" &&
    owner.length > 0 &&
    !owner.includes("[]") &&
    (path === owner + "[]" || path.startsWith(owner + "[].")) &&
    (path.match(/\[\]/g)?.length ?? 0) === 1 &&
    typeof maxItems === "number" &&
    Number.isSafeInteger(maxItems) &&
    maxItems > 0 &&
    Array.isArray(slots) &&
    slots.length === maxItems &&
    slots.every(
      (b) =>
        b.kind === "slot" &&
        typeof b.path === "string" &&
        b.path.trim() !== "" &&
        Number.isSafeInteger(b.index) &&
        b.index >= 0 &&
        b.index < maxItems,
    ) &&
    new Set(slots.map((b) => b.index)).size === maxItems &&
    new Set(slots.map((b) => (source === "xsd" ? fromXmlPath(b.path) : b.path)))
      .size === maxItems;
  if (!valid) {
    problems.push({
      kind: "source binding invalid",
      path: path ?? field.label,
      detail:
        "Source slots must cover exactly one finite repeated owner, without shorthand, duplicate paths or indices",
    });
    return [];
  }
  return slots.map((b) => ({
    path: source === "xsd" ? fromXmlPath(b.path) : b.path,
    owner,
    index: b.index,
    maxItems: 1,
  }));
}

/** Every bound choice code must be a value the linked XSD enumeration permits. */
export function choiceValueProblems(
  field: PlanField,
  xsd: import("./harness/model.ts").FlatField | undefined,
): Discrepancy[] {
  const bindings = field.source_bindings;
  if (!bindings || "at" in bindings) return [];
  const allowed = xsd?.rules.enum;
  return bindings.dat.flatMap((b) =>
    Array.isArray(allowed) && allowed.includes(b.value)
      ? []
      : [
          {
            kind: "choice code outside XSD",
            path: b.path,
            detail: "declared DAT choice is not in the linked XSD enumeration",
          },
        ],
  );
}
