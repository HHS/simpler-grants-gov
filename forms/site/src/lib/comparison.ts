/**
 * Pure helpers for the field comparison on a form's page: which fields a filter shows, what
 * each field differs in, and how the sheet words it. The stores in `stores/fieldComparison.ts`
 * hold the state; these only compute from it.
 */
import type { FieldNode } from "@/content.config";
import type {
  Attribute,
  AttributeRow,
  Cell,
  ComparisonNode,
  FieldComparison as ParityField,
  FormComparison as ParityForm,
  Source,
  Status,
} from "@parity/comparison.ts";

export type { Attribute, AttributeRow, Cell, ComparisonNode, Source, Status };
export type FieldComparison = ParityField<FieldNode>;
export type FormComparison = ParityForm<FieldNode>;

/** A recorded difference's category. */
export type DiffType = "gap" | "upstream" | "intentional";
/** What the tree counts: each recorded category, and differences no record accepts. */
export type TallyKey = "unrecorded" | DiffType;
export type Tally = Record<TallyKey, number>;
/** What a filter tile selects: fields with a kind of difference, or fields with none. */
export type FilterKey = TallyKey | "matches";

export const DIFF_TYPES: readonly DiffType[] = [
  "gap",
  "upstream",
  "intentional",
];
/** Unrecorded first: each one fails the parity tests. */
export const TALLY_KEYS: readonly TallyKey[] = ["unrecorded", ...DIFF_TYPES];
export const FILTER_KEYS: readonly FilterKey[] = [...TALLY_KEYS, "matches"];
export const SOURCES: readonly Source[] = ["dat", "xsd", "form"];

export const SOURCE_LABELS: Record<Source, string> = {
  dat: "DAT",
  xsd: "XSD",
  form: "Form",
};

export const ATTRIBUTE_LABELS: Record<Attribute, string> = {
  matchedBy: "Matched by",
  label: "Label",
  help: "Help",
  required: "Required",
  length: "Length",
  format: "Format",
  range: "Range",
  options: "Options",
  position: "Position",
  xmlMapping: "XML mapping",
};

export const STATUS: Record<
  Status,
  {
    label: string;
    /** How a count of them reads, e.g. "2 unrecorded"; the label when unset. */
    short?: string;
    symbol: string;
    description: string;
  }
> = {
  match: {
    label: "Match",
    symbol: "✓",
    description: "Matches every source it is compared with.",
  },
  intentional: {
    label: "Intentional",
    symbol: "I",
    description: "Simpler Grants intentionally differs from Grants.gov.",
  },
  upstream: {
    label: "Upstream",
    symbol: "U",
    description: "The Grants.gov DAT and XSD disagree.",
  },
  gap: {
    label: "Gap",
    symbol: "G",
    description: "A known gap awaiting a fix.",
  },
  notCompared: {
    label: "Not compared",
    symbol: "–",
    description: "Not compared.",
  },
  unrecorded: {
    label: "Unrecorded difference",
    short: "Unrecorded",
    symbol: "!",
    description:
      "A difference no record accepts. The parity tests fail until it is recorded.",
  },
};

/** One cell of a field's matrix. */
export interface CellRef {
  attribute: Attribute;
  source: Source;
}

/** A cell that differs from the plan, with its row. */
export interface Difference extends CellRef {
  row: AttributeRow;
  cell: Cell;
}

const DIFFERS = new Set<Status>([...DIFF_TYPES, "unrecorded"]);

export const isDiffType = (status: Status): status is DiffType =>
  (DIFF_TYPES as readonly Status[]).includes(status);

/** Every cell that differs from the plan, row by row. */
export function differences(field: FieldComparison): Difference[] {
  return field.rows.flatMap((row) =>
    SOURCES.filter((source) => DIFFERS.has(row.cells[source].status)).map(
      (source) => ({
        attribute: row.attribute,
        source,
        row,
        cell: row.cells[source],
      }),
    ),
  );
}

export const matchesEverySource = (field: FieldComparison) =>
  differences(field).length === 0;

/** The field's differences in the selected attributes; all of them when none is selected. */
export function differencesIn(
  field: FieldComparison,
  attributes: readonly Attribute[] = [],
): Difference[] {
  const all = differences(field);
  return attributes.length
    ? all.filter(({ attribute }) => attributes.includes(attribute))
    : all;
}

const emptyTally = (): Tally => ({
  unrecorded: 0,
  gap: 0,
  upstream: 0,
  intentional: 0,
});

/**
 * How many of the field's differences in the selected attributes fall in each category, and
 * how many no record accepts.
 */
export function countsIn(
  field: FieldComparison,
  attributes: readonly Attribute[] = [],
): Tally {
  const counts = emptyTally();
  for (const { cell } of differencesIn(field, attributes))
    if (isDiffType(cell.status) || cell.status === "unrecorded")
      counts[cell.status] += 1;
  return counts;
}

/**
 * Fields any selected category selects, counting only differences in the selected attributes;
 * every field when nothing is selected. With attributes and no category, a field shows if it
 * differs in any of them.
 */
export function visibleFields(
  fields: readonly FieldComparison[],
  filter: readonly FilterKey[],
  attributes: readonly Attribute[] = [],
): FieldComparison[] {
  if (!filter.length && !attributes.length) return [...fields];
  return fields.filter((field) => {
    const differs = differencesIn(field, attributes).length > 0;
    if (!filter.length) return differs;
    const counts = countsIn(field, attributes);
    return filter.some((key) =>
      key === "matches" ? !differs : counts[key] > 0,
    );
  });
}

/** A section as the tree shows it: the fields the filter left, out of `total`. */
export type VisibleSection = Extract<ComparisonNode, { kind: "section" }> & {
  children: VisibleNode[];
  total: number;
};
export type VisibleNode =
  Extract<ComparisonNode, { kind: "field" }> | VisibleSection;

/**
 * The plan's tree cut down to the fields in `visible`, keeping each section that still holds
 * one and dropping the rest.
 */
export function visibleTree(
  nodes: readonly ComparisonNode[],
  visible: ReadonlySet<string>,
): VisibleNode[] {
  return nodes.flatMap((node): VisibleNode[] => {
    if (node.kind === "field") return visible.has(node.id) ? [node] : [];
    const children = visibleTree(node.children, visible);
    return children.length
      ? [{ ...node, children, total: fieldCount(node) }]
      : [];
  });
}

/** How many fields a node holds: one for a field, every field under a section. */
export function fieldCount(node: ComparisonNode): number {
  return node.kind === "field"
    ? 1
    : node.children.reduce((sum, child) => sum + fieldCount(child), 0);
}

/**
 * The differences in every field under `node`, by category. While a filter is on, only its
 * categories and attributes are summed, so a section's badges agree with the rows it shows.
 */
export function rollupCounts(
  node: ComparisonNode,
  fields: ReadonlyMap<string, FieldComparison>,
  filter: readonly FilterKey[] = [],
  attributes: readonly Attribute[] = [],
): Tally {
  const shown = filter.some((key) => key !== "matches")
    ? TALLY_KEYS.filter((key) => filter.includes(key))
    : filter.length
      ? []
      : TALLY_KEYS;
  const sum = emptyTally();
  const visit = (n: ComparisonNode) => {
    if (n.kind === "section") return n.children.forEach(visit);
    const field = fields.get(n.id);
    if (field) {
      const counts = countsIn(field, attributes);
      for (const type of shown) sum[type] += counts[type];
    }
  };
  visit(node);
  return sum;
}

/** How many entries a repeating node allows, e.g. "1–4 entries"; undefined when it does not repeat. */
export function repeatLabel(node: {
  min_items?: number;
  max_items?: number | "unbounded";
}): string | undefined {
  const { min_items: min, max_items: max } = node;
  if (max === undefined && min === undefined) return undefined;
  if (max === undefined || max === "unbounded")
    return min ? `${min} or more entries` : "Any number of entries";
  if (min === undefined) return `Up to ${max} entries`;
  return min === max ? `${max} entries` : `${min}–${max} entries`;
}

/**
 * For each tile: how many differences (or matching fields), and in how many fields. Only
 * differences in the selected attributes count.
 */
export function categoryCounts(
  fields: readonly FieldComparison[],
  attributes: readonly Attribute[] = [],
): Record<FilterKey, { count: number; fields: number }> {
  const matching = fields.filter(
    (field) => differencesIn(field, attributes).length === 0,
  ).length;
  const counts = { matches: { count: matching, fields: matching } } as Record<
    FilterKey,
    { count: number; fields: number }
  >;
  for (const key of TALLY_KEYS) {
    const each = fields.map((field) => countsIn(field, attributes)[key]);
    counts[key] = {
      count: each.reduce((sum, n) => sum + n, 0),
      fields: each.filter((n) => n > 0).length,
    };
  }
  return counts;
}

/**
 * For each attribute that differs anywhere: how many differences, and in how many fields. While
 * a category is selected, only its differences count.
 */
export function attributeCounts(
  fields: readonly FieldComparison[],
  filter: readonly FilterKey[] = [],
): { attribute: Attribute; count: number; fields: number }[] {
  const keys = TALLY_KEYS.filter((key) => filter.includes(key));
  const counted = (d: Difference) =>
    !keys.length || (keys as readonly Status[]).includes(d.cell.status);
  return (Object.keys(ATTRIBUTE_LABELS) as Attribute[])
    .map((attribute) => {
      const each = fields.map(
        (field) => differencesIn(field, [attribute]).filter(counted).length,
      );
      return {
        attribute,
        count: each.reduce((sum, n) => sum + n, 0),
        fields: each.filter((n) => n > 0).length,
      };
    })
    .filter(({ count }) => count > 0);
}

/** The cell selected when a field opens: its first difference, if it has one. */
export function defaultCell(field: FieldComparison): CellRef | null {
  const [first] = differences(field);
  return first ? { attribute: first.attribute, source: first.source } : null;
}

/** The field's differences of the selected types; all of them when none is selected. */
export function visibleDifferences(
  field: FieldComparison,
  filter: readonly DiffType[],
): Difference[] {
  const all = differences(field);
  if (!filter.length) return all;
  return all.filter(
    ({ cell }) => !isDiffType(cell.status) || filter.includes(cell.status),
  );
}

/** How many of the field's differences fall in each category. */
export function diffTypeCounts(
  field: FieldComparison,
): Record<DiffType, number> {
  const counts: Record<DiffType, number> = {
    gap: 0,
    upstream: 0,
    intentional: 0,
  };
  for (const { cell } of differences(field))
    if (isDiffType(cell.status)) counts[cell.status] += 1;
  return counts;
}

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;

const listed = (items: string[]) =>
  items.length <= 1
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/** One line under the sheet's title: what the field differs from, and why that is safe. */
export function summarize(field: FieldComparison): string {
  const all = differences(field);
  if (!all.length) return "Matches every source it is compared with.";
  const sources = SOURCES.filter((source) =>
    all.some((d) => d.source === source),
  );
  const names = sources.map((source) => `the ${SOURCE_LABELS[source]}`);
  const counts = diffTypeCounts(field);
  const kinds = DIFF_TYPES.filter((type) => counts[type]).map(
    (type) => `${counts[type]} ${STATUS[type].label.toLowerCase()}`,
  );
  const unrecorded = all.filter((d) => d.cell.status === "unrecorded").length;
  if (unrecorded) kinds.push(`${unrecorded} unrecorded`);
  const verdict = unrecorded
    ? `${plural(unrecorded, "difference is", "differences are")} not recorded, so the parity tests fail.`
    : "Every difference is recorded and checked by the parity tests.";
  return `Differs from ${listed(names)} in ${plural(all.length, "place")}: ${kinds.join(", ")}. ${verdict}`;
}

/** How the field tree words a plan field's requiredness, as `FieldRow.astro` does. */
export function requiredLabel(field: FieldNode): string | undefined {
  if (field.required === true) return "* Required";
  if (typeof field.required === "string" && field.required !== "false")
    return field.required;
  return undefined;
}
