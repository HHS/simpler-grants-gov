/** Format the harness-owned field result for the form library's existing comparison table. */
import {
  getFormResult,
  SOURCES,
  ATTRIBUTES,
  type Source,
  type Attribute,
  type Status,
  type Category,
  type FieldResult,
  type FormResult,
  type Finding,
  type Plan,
  type PlanField,
  type PlanNode,
  type PlanSection,
} from "./index.ts";
import {
  showRequired,
  showLength,
  showRules,
  showOptions,
  showPosition,
} from "./format.ts";
export { SOURCES, type Source, type Attribute, type Status } from "./index.ts";

/** One attribute of one field, as one source states it. */
export interface Cell {
  status: Status;
  /** The source's value, as compared. Null when it states none. */
  value: string | null;
  /** The plan's value as this comparison reads it, where it differs from the row's. */
  plan?: string | null;
  /** The recorded reason for a difference, or why the attribute is not compared. */
  reason?: string;
  /** For options that differ: values the source lists that the form does not, and the reverse. */
  options?: { missing: string[]; extra: string[] };
}

export interface AttributeRow {
  attribute: Attribute;
  /** The plan's value. Null when it states none. */
  plan: string | null;
  cells: Record<Source, Cell>;
}

export type CategoryCounts = Record<Category, number>;

export interface FieldComparison<F extends PlanField = PlanField> {
  /** The field's `json_path`, or its position in the plan when it has none. */
  id: string;
  field: F;
  rows: AttributeRow[];
  /** Cells in each category. */
  counts: CategoryCounts;
}

/** A plan section's own metadata, without its children. */
export type SectionMeta = Omit<PlanSection, "children">;

/** The plan's tree, with each field named by its comparison's `id`. */
export type ComparisonNode =
  | { kind: "field"; id: string }
  | { kind: "section"; section: SectionMeta; children: ComparisonNode[] };

export interface FormComparison<F extends PlanField = PlanField> {
  children: ComparisonNode[];
  /** Every field, in plan order. */
  fields: FieldComparison<F>[];
}

const OPTIONAL_ROWS = new Set<Attribute>([
  "length",
  "format",
  "range",
  "options",
  "xmlMapping",
]);

function buildField<F extends PlanField>(
  result: FieldResult<F>,
): FieldComparison<F> {
  const { field, sources } = result;
  const value = (attribute: Attribute, source: Source): string | null => {
    const facts = sources[source];
    switch (attribute) {
      case "matchedBy":
        return facts.path ?? null;
      case "label":
        return facts.label ?? null;
      case "help":
        return facts.help ?? null;
      case "required":
        return showRequired(facts);
      case "length":
        return showLength(facts);
      case "format":
        return showRules(facts, ["pattern", "format"]);
      case "range":
        return showRules(facts, ["minimum", "maximum"]);
      case "options":
        return showOptions(facts);
      case "position":
        return showPosition(facts.position);
      case "xmlMapping":
        return source === "form" && result.writtenPaths.length
          ? result.writtenPaths.join(", ")
          : null;
    }
  };
  const planPosition = (source: Source) =>
    showPosition(sources[source].planPosition);
  const planValue = (attribute: Attribute): string | null => {
    switch (attribute) {
      case "matchedBy":
        return null;
      case "label":
        return field.label;
      case "help":
        return field.help_text ?? null;
      case "required":
        return typeof field.required === "string"
          ? field.required
          : showRequired(result.plan);
      case "length":
        return showLength(result.plan);
      case "format":
        return showRules(result.plan, ["pattern", "format"]);
      case "range":
        return showRules(result.plan, ["minimum", "maximum"]);
      case "options":
        return showOptions(result.plan);
      case "position":
        return planPosition("dat") ?? planPosition("form");
      case "xmlMapping":
        return sources.xsd.key ?? null;
    }
  };
  const rows: AttributeRow[] = ATTRIBUTES.map((attribute) => ({
    attribute,
    plan: planValue(attribute),
    cells: Object.fromEntries(
      SOURCES.map((source) => {
        const { status, reason, options } = result.outcomes[attribute][source];
        const extra: Partial<Cell> = {};
        if (attribute === "matchedBy") extra.plan = sources[source].key ?? null;
        if (attribute === "position" && source !== "dat")
          extra.plan = planPosition(source);
        return [
          source,
          {
            status,
            value: value(attribute, source),
            ...(reason !== undefined ? { reason } : {}),
            ...(options ? { options } : {}),
            ...extra,
          },
        ];
      }),
    ) as Record<Source, Cell>,
  })).filter(
    (row) =>
      !OPTIONAL_ROWS.has(row.attribute) ||
      row.plan !== null ||
      SOURCES.some((source) => row.cells[source].value !== null),
  );
  const counts: CategoryCounts = { intentional: 0, upstream: 0, gap: 0 };
  for (const row of rows)
    for (const source of SOURCES) {
      const status = row.cells[source].status;
      if (status in counts) counts[status as Category]++;
    }
  return { id: result.id, field, rows, counts };
}

export interface InspectedComparison<
  F extends PlanField = PlanField,
> extends FormComparison<F> {
  findings: Finding[];
}

/** No source reads, field indexing, path matching or check selection takes place here. */
export function projectComparison<F extends PlanField = PlanField>(
  result: FormResult<F>,
): InspectedComparison<F> {
  const fields = result.fields.map(buildField);
  let nextField = 0;
  const tree = (nodes: PlanNode<F>[] = []): ComparisonNode[] =>
    nodes.map((node) => {
      if (node.kind === "section") {
        const { children, ...section } = node;
        return { kind: "section", section, children: tree(children) };
      }
      return { kind: "field", id: fields[nextField++].id };
    });
  return {
    children: tree(result.plan.children),
    fields,
    findings: result.findings,
  };
}

export async function compareForm<F extends PlanField>(
  plan: Plan<F>,
): Promise<InspectedComparison<F> | null> {
  const result = await getFormResult(plan);
  return result ? projectComparison(result) : null;
}
