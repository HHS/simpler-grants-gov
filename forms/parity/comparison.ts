import { choiceValueProblems, sourceCoordinates } from "./sourceBindings.ts";
/**
 * Each plan field beside the same field in the DAT, the XSD and the compiled form, as the form
 * library's comparison sheet shows it.
 *
 * Every status comes from the harness: a cell matches only when the tests compare that
 * attribute and find no difference, and differs only where they report one. Nothing here
 * compares values itself. It reads every artifact from disk, so it runs only at build time.
 */
import { DIFFS } from "./diffs/index.ts";
import {
  comparePair,
  formPairs,
  matchFields,
  SPECS,
  type Accepted,
  type Discrepancy,
  type FlatField,
  type Pair,
  type PairResult,
  type Plan,
  type PlanField,
  type PlanNode,
  type PlanSection,
  walkFields,
} from "./harness/index.ts";
import { readRequired } from "./harness/flatten/plan.ts";
import { link } from "./harness/flatten/xmlTransform.ts";
import { fromXmlPath, type Category } from "./harness/model.ts";

export type Source = "dat" | "xsd" | "form";

export const SOURCES: readonly Source[] = ["dat", "xsd", "form"];

export type Status = "match" | Category | "notCompared" | "unrecorded";

export type Attribute =
  | "matchedBy"
  | "label"
  | "help"
  | "required"
  | "length"
  | "format"
  | "range"
  | "options"
  | "position"
  | "xmlMapping";

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

// ---------------------------------------------------------------------------------------
// Which attribute each check covers
// ---------------------------------------------------------------------------------------

const KEYWORDS: Partial<Record<Attribute, readonly string[]>> = {
  length: ["minLength", "maxLength"],
  format: ["pattern", "format"],
  range: ["minimum", "maximum", "multipleOf"],
  options: ["enumType", "enum"],
};

/** The attribute a discrepancy is about, or undefined for one the sheet does not show. */
function attributeOf(kind: string): Attribute | undefined {
  switch (kind) {
    case "missing from source":
    case "missing from plan":
      return "matchedBy";
    case "out of order":
      return "position";
    case "label differs":
      return "label";
    case "help differs":
      return "help";
    case "requiredness differs":
      return "required";
  }
  const keyword = kind.replace(/ differs$/, "");
  return (Object.keys(KEYWORDS) as Attribute[]).find((attribute) =>
    KEYWORDS[attribute]!.includes(keyword),
  );
}

type Spec = (typeof SPECS)[keyof typeof SPECS];

/** Whether a spec compares an attribute at all. */
function compares(spec: Spec, attribute: Attribute): boolean {
  switch (attribute) {
    case "matchedBy":
      return true;
    case "label":
      return "labels" in spec && spec.labels;
    case "help":
      return "help" in spec && spec.help;
    case "position":
      return "order" in spec && spec.order;
    case "required":
      return "constraints" in spec;
    case "xmlMapping":
      return true;
  }
  const keywords: readonly string[] =
    "constraints" in spec ? spec.constraints.keywords : [];
  return KEYWORDS[attribute]!.some((keyword) => keywords.includes(keyword));
}

/** Why a source is never compared on an attribute. */
const NOT_COMPARED: Partial<
  Record<Source, Partial<Record<Attribute, string>>>
> = {
  dat: {
    xmlMapping: "The DAT names no XML elements.",
    format:
      "The DAT is compared on text length and numeric value bounds, not on patterns or formats.",
    options:
      "The DAT's list of values is not compared. The XSD's code list is, and the form's values are compared with it.",
  },
  xsd: {
    label: "The XSD has no labels.",
    help: "The XSD has no help text.",
    position:
      "Field order is compared with the DAT, which sets the order Grants.gov shows.",
    xmlMapping:
      "The plan's XSD path is compared with the XSD on Matched by. This row compares what the form's XML rules write.",
  },
};

// ---------------------------------------------------------------------------------------
// Values as the sheet shows them
// ---------------------------------------------------------------------------------------

const REQUIRED = {
  yes: "Required",
  no: "Optional",
  conditional: "Conditional",
};

function showRequired(field: FlatField | undefined): string | null {
  return field?.required ? REQUIRED[field.required] : null;
}

function showLength(field: FlatField | undefined): string | null {
  const { minLength: min, maxLength: max } = field?.rules ?? {};
  if (min === undefined && max === undefined) return null;
  if (min !== undefined && max !== undefined) return `${min}–${max} characters`;
  return min !== undefined
    ? `At least ${min} characters`
    : `Up to ${max} characters`;
}

function showRules(
  field: FlatField | undefined,
  keywords: readonly (
    "pattern" | "format" | "minimum" | "maximum" | "multipleOf"
  )[],
): string | null {
  const stated = keywords.flatMap((keyword) => {
    const value = field?.rules[keyword];
    return value === undefined ? [] : [`${keyword} ${value}`];
  });
  return stated.length ? stated.join(" · ") : null;
}

const listOf = (value: unknown): string[] | undefined =>
  Array.isArray(value) ? value.map(String) : undefined;

function showOptions(field: FlatField | undefined): string | null {
  const type = field?.rules.enumType;
  const values = listOf(field?.rules.enum);
  const count = values && `${values.length} values`;
  if (type && count) return `${type} (${count})`;
  return (type as string | undefined) ?? count ?? null;
}

/** "After First Name · before Last Name", from the labels of the fields either side. */
function neighbors(sequence: string[], at: number): string {
  const before = sequence[at - 1];
  const after = sequence[at + 1];
  return [
    before ? `After ${before}` : "First",
    after ? `before ${after}` : "last",
  ].join(" · ");
}

// ---------------------------------------------------------------------------------------
// One comparison, ready to read cells from
// ---------------------------------------------------------------------------------------

/** One pair's results, indexed by the plan key and attribute they concern. */
interface Side {
  pair: Pair;
  spec: Spec;
  matched: Map<string, string>;
  found: Map<string, { accepted: Accepted[]; unexpected: Discrepancy[] }>;
  /** Plan keys in the source's order, for position. */
  sourceOrder: string[];
}

const unexpectedIn = (result: PairResult): Discrepancy[] => [
  ...result.missingFields,
  ...result.extraFields,
  ...result.fieldOrder,
  ...result.fieldLabels,
  ...result.fieldConstraints,
  ...result.fieldOccurrences,
  ...result.helpText,
];

/** `attributeFor` names the row each discrepancy is shown on; by default, the one its kind concerns. */
function side(
  pair: Pair,
  spec: Spec,
  attributeFor: (kind: string) => Attribute | undefined = attributeOf,
): Side {
  const result = comparePair(pair, spec);
  const found: Side["found"] = new Map();
  const add = (d: Discrepancy, into: "accepted" | "unexpected") => {
    const attribute = attributeFor(d.kind);
    if (!attribute) return;
    const key = `${d.path}#${attribute}`;
    if (!found.has(key)) found.set(key, { accepted: [], unexpected: [] });
    (found.get(key)![into] as Discrepancy[]).push(d);
  };
  result.recorded.forEach((d) => add(d, "accepted"));
  unexpectedIn(result).forEach((d) => add(d, "unexpected"));
  const matched = matchFields(pair);
  const sourceOrder = [...matched]
    .filter(([, target]) => pair.source.get(target)?.order !== undefined)
    .sort(
      ([, a], [, b]) => pair.source.get(a)!.order! - pair.source.get(b)!.order!,
    )
    .map(([path]) => path);
  return { pair, spec, matched, found, sourceOrder };
}

const RANK: Status[] = [
  "unrecorded",
  "gap",
  "upstream",
  "intentional",
  "match",
];

/** The status and reason the harness's findings give one cell. */
function judge(
  sides: readonly (Side | undefined)[],
  key: (side: Side) => string | undefined,
  attribute: Attribute,
): { status: Status; reason?: string } {
  const accepted: Accepted[] = [];
  let unexpected = false;
  let compared = false;
  for (const s of sides) {
    const path = s && key(s);
    if (!s || !path || !compares(s.spec, attribute)) continue;
    compared = true;
    const found = s.found.get(`${path}#${attribute}`);
    accepted.push(...(found?.accepted ?? []));
    unexpected ||= Boolean(found?.unexpected.length);
  }
  if (unexpected)
    return {
      status: "unrecorded",
      reason:
        "The parity tests report this difference, and no record accepts it.",
    };
  if (!compared) return { status: "notCompared" };
  if (!accepted.length) return { status: "match" };
  const status = RANK.find((rank) =>
    accepted.some((d) => d.entry.category === rank),
  )!;
  const reasons = [...new Set(accepted.map((d) => d.entry.reason))];
  return { status, reason: reasons.join(" ") };
}

// ---------------------------------------------------------------------------------------
// Building the comparison
// ---------------------------------------------------------------------------------------

/** How each source finds a plan field, and what the sheet calls the key. */
const KEYS: Record<
  Source,
  { key: (field: PlanField) => string | undefined; name: string }
> = {
  dat: { key: (f) => f.dat_field, name: "DAT field number" },
  xsd: { key: (f) => f.xml_path && fromXmlPath(f.xml_path), name: "XSD path" },
  form: { key: (f) => f.json_path, name: "JSON path" },
};

const SOURCE_NAMES: Record<Source, string> = {
  dat: "DAT",
  xsd: "XSD",
  form: "form",
};

const ATTRIBUTES: Attribute[] = [
  "matchedBy",
  "label",
  "help",
  "required",
  "length",
  "format",
  "range",
  "options",
  "position",
  "xmlMapping",
];

/** Rows shown only when the plan or a source states a value. */
const OPTIONAL_ROWS = new Set<Attribute>([
  "length",
  "format",
  "range",
  "options",
  "xmlMapping",
]);

interface Sides {
  dat: Side;
  xsd: Side;
  jsonSchema?: Side;
  uiSchema?: Side;
  jsonSchemaVsXsd?: Side;
  /** Absent for a form with no emitted XML transform. */
  xml?: { plan: Side; jsonSchema: Side; xsd: Side };
}

/** The pairs that judge each source's cells for an attribute. */
function sidesFor(
  sides: Sides,
  source: Source,
  attribute: Attribute,
): (Side | undefined)[] {
  if (source !== "form") return [sides[source]];
  switch (attribute) {
    case "label":
    case "help":
    case "position":
      return [sides.uiSchema];
    case "options":
      return [sides.jsonSchemaVsXsd];
    case "matchedBy":
      return [sides.jsonSchema];
    case "xmlMapping":
      return sides.xml
        ? [sides.xml.plan, sides.xml.jsonSchema, sides.xml.xsd]
        : [];
    default:
      return [sides.jsonSchema, sides.jsonSchemaVsXsd];
  }
}

function buildField<F extends PlanField>(
  field: F,
  fallbackId: string,
  sides: Sides,
  labels: Record<Source, Map<string, string>>,
): FieldComparison<F> {
  const keys = Object.fromEntries(
    SOURCES.map((source) => [source, KEYS[source].key(field)]),
  ) as Record<Source, string | undefined>;
  const planSide = (source: Source) =>
    source === "form" ? sides.jsonSchema : sides[source];
  const planFlat =
    sides.dat.pair.plan.get(keys.dat ?? "") ??
    sides.xsd.pair.plan.get(keys.xsd ?? "") ??
    sides.jsonSchema?.pair.plan.get(keys.form ?? "");
  /** The source's own field matched to this plan field, and the side that matched it. */
  const sourceField = (source: Source, s: Side | undefined) => {
    const key = keys[source];
    const target = key && s?.matched.get(key);
    return target ? s!.pair.source.get(target) : undefined;
  };
  // The form's rules come from the compiled schema; its label, help and order from the UI.
  const formRules = sourceField("form", sides.jsonSchema);
  const formUi = sourceField("form", sides.uiSchema);
  const xsdField = sourceField("xsd", sides.xsd);
  const flat: Record<Source, { rules?: FlatField; text?: FlatField }> = {
    dat: {
      rules: sourceField("dat", sides.dat),
      text: sourceField("dat", sides.dat),
    },
    xsd: { rules: xsdField, text: xsdField },
    form: { rules: formRules, text: formUi },
  };
  const joinedXsd = keys.form
    ? sides.jsonSchemaVsXsd?.pair.source.get(
        sides.jsonSchemaVsXsd.matched.get(
          sides.jsonSchema?.matched.get(keys.form) ?? keys.form,
        ) ?? "",
      )
    : undefined;
  /** The compiled schema's path for the field, which the XML rules read. */
  const schemaPath =
    keys.form && (sides.jsonSchema?.matched.get(keys.form) ?? keys.form);
  /** The elements the form's XML rules write the field to. */
  const written = schemaPath
    ? [...(sides.xml?.plan.pair.source.keys() ?? [])]
        .filter((rule) => rule.startsWith(link(schemaPath, "")))
        .map((rule) => rule.slice(link(schemaPath, "").length))
    : [];

  const position = (source: Source) => {
    const s = source === "form" ? sides.uiSchema : sides[source];
    const key = keys[source];
    const at = key && s ? s.sourceOrder.indexOf(key) : -1;
    if (!s || at === -1) return null;
    return neighbors(
      s.sourceOrder.map((k) => labels[source].get(k) ?? k),
      at,
    );
  };
  const planPosition = (source: Source) => {
    const s = source === "form" ? sides.uiSchema : sides[source];
    const key = keys[source];
    if (!s || !key) return null;
    const order = [...s.pair.plan]
      .filter(([, f]) => f.order !== undefined)
      .sort(([, a], [, b]) => a.order! - b.order!)
      .map(([k]) => k);
    const at = order.indexOf(key);
    return at === -1
      ? null
      : neighbors(
          order.map((k) => labels[source].get(k) ?? k),
          at,
        );
  };

  const value = (attribute: Attribute, source: Source): string | null => {
    const { rules, text } = flat[source];
    switch (attribute) {
      case "matchedBy": {
        const key = keys[source];
        const s = planSide(source);
        return (key && s?.matched.get(key)) || null;
      }
      case "label":
        return text?.label ?? null;
      case "help":
        return text?.help ?? null;
      case "required":
        return showRequired(rules);
      case "length":
        return showLength(rules);
      case "format":
        return showRules(rules, ["pattern", "format"]);
      case "range":
        return showRules(rules, ["minimum", "maximum", "multipleOf"]);
      case "options":
        return showOptions(rules);
      case "position":
        return position(source);
      case "xmlMapping":
        return source === "form" && written.length ? written.join(", ") : null;
    }
  };

  const planValue = (attribute: Attribute): string | null => {
    switch (attribute) {
      case "matchedBy":
        return null;
      case "label":
        return field.label;
      case "help":
        return field.help_text ?? null;
      case "required": {
        const required = readRequired(field.required);
        return typeof field.required === "string"
          ? field.required
          : required
            ? REQUIRED[required]
            : null;
      }
      case "length":
        return showLength(planFlat);
      case "format":
        return showRules(planFlat, ["pattern", "format"]);
      case "range":
        return showRules(planFlat, ["minimum", "maximum", "multipleOf"]);
      case "options":
        return showOptions(planFlat);
      case "position":
        return planPosition("dat") ?? planPosition("form");
      case "xmlMapping":
        return keys.xsd ?? null;
    }
  };

  /**
   * Whether the form's XML rules write the field to the element the plan links it to. The
   * three XML comparisons judge it together, so a link they all miss counts once.
   */
  const xmlCell = (source: Source): Cell => {
    const cellValue = value("xmlMapping", source);
    const never = NOT_COMPARED[source]?.xmlMapping;
    if (never) return { status: "notCompared", value: null, reason: never };
    if (!sides.xml)
      return {
        status: "notCompared",
        value: null,
        reason:
          "This form has no XML transform rules yet, so what it writes to XML is not compared.",
      };
    if (!keys.form || !keys.xsd)
      return {
        status: "notCompared",
        value: cellValue,
        reason: `The plan gives no ${keys.form ? KEYS.xsd.name : KEYS.form.name} for this field, so it links it to no element.`,
      };
    const xsdPath = sides.xsd.matched.get(keys.xsd) ?? keys.xsd;
    const pathFor = (s: Side) =>
      s === sides.xml!.plan
        ? link(keys.form!, keys.xsd!)
        : s === sides.xml!.jsonSchema
          ? schemaPath
          : xsdPath;
    return {
      ...judge(sidesFor(sides, source, "xmlMapping"), pathFor, "xmlMapping"),
      value: cellValue,
    };
  };

  const cell = (attribute: Attribute, source: Source): Cell => {
    if (attribute === "xmlMapping") return xmlCell(source);
    const key = keys[source];
    const s = planSide(source);
    const name = SOURCE_NAMES[source];
    const cellValue = value(attribute, source);
    const extra: Partial<Cell> = {};
    if (attribute === "matchedBy") extra.plan = key ?? null;
    if (attribute === "position" && source !== "dat")
      extra.plan = planPosition(source);

    if (!key)
      return {
        status: "notCompared",
        value: null,
        ...extra,
        reason: `The plan gives no ${KEYS[source].name} for this field.`,
      };
    if (!s)
      return {
        status: "notCompared",
        value: null,
        ...extra,
        reason: "This form has no compiled spec to compare.",
      };
    const never = NOT_COMPARED[source]?.[attribute];
    // The XSD's order is not the order Grants.gov shows, so it is left out rather than shown.
    if (never)
      return {
        status: "notCompared",
        value: attribute === "position" ? null : cellValue,
        ...extra,
        reason: never,
      };
    if (attribute !== "matchedBy" && !s.matched.has(key))
      return {
        status: "notCompared",
        value: null,
        ...extra,
        reason: `The ${name} has no field matching this one.`,
      };

    const pathFor = (side: Side) =>
      side === sides.jsonSchemaVsXsd
        ? (sides.jsonSchema?.matched.get(key) ?? undefined)
        : key;
    const judged = judge(
      sidesFor(sides, source, attribute),
      pathFor,
      attribute,
    );

    if (judged.status === "notCompared")
      return {
        ...judged,
        value: cellValue,
        ...extra,
        reason:
          source === "form" && attribute === "options"
            ? "The plan gives no XSD path, so the form's values have no code list to compare with."
            : `The ${name} is not compared on this.`,
      };
    if (
      attribute === "required" &&
      judged.status === "match" &&
      readRequired(field.required) === "conditional"
    )
      return {
        status: "notCompared",
        value: cellValue,
        reason: `The tests check only that the ${name} does not always require this field. The condition itself waits on the rules-schema check.`,
      };
    if (
      attribute === "matchedBy" &&
      judged.status === "match" &&
      cellValue !== key
    ) {
      const renamed = s.pair.registers.renamed?.[key];
      if (renamed)
        return {
          status: renamed.category,
          value: cellValue,
          ...extra,
          reason: renamed.reason,
        };
    }
    if (attribute === "options" && source === "form") {
      const formValues = listOf(formRules?.rules.enum) ?? [];
      const xsdValues = listOf(joinedXsd?.rules.enum) ?? [];
      const missing = xsdValues.filter((v) => !formValues.includes(v));
      const extraValues = formValues.filter((v) => !xsdValues.includes(v));
      if (missing.length || extraValues.length)
        extra.options = { missing, extra: extraValues };
    }
    return { ...judged, value: cellValue, ...extra };
  };

  const rows: AttributeRow[] = ATTRIBUTES.map((attribute) => ({
    attribute,
    plan: planValue(attribute),
    cells: Object.fromEntries(
      SOURCES.map((source) => [source, cell(attribute, source)]),
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
      const { status } = row.cells[source];
      if (status in counts) counts[status as Category] += 1;
    }

  return {
    id: field.json_path ?? fallbackId,
    field,
    rows,
    counts,
  };
}

/** A repeated answer has several DAT cells; no last-cell mismatch may disappear in the summary. */
function buildBoundField<F extends PlanField>(
  field: F,
  maxItems: import("./harness/flatten/plan.ts").MaxItems,
  fallback: string,
  sides: Sides,
  labels: Record<Source, Map<string, string>>,
): FieldComparison<F> {
  if (!field.source_bindings) return buildField(field, fallback, sides, labels);
  const coordinates = sourceCoordinates(field, maxItems, "dat");
  const copies = coordinates.map((c) =>
    buildField({ ...field, dat_field: c.path }, fallback, sides, labels),
  );
  const base = copies[0] ?? buildField(field, fallback, sides, labels);
  const rows = base.rows.map((row) => {
    const cells = copies
      .map((copy, index) => ({
        path: coordinates[index].path,
        cell: copy.rows.find((r) => r.attribute === row.attribute)?.cells.dat,
      }))
      .filter((x): x is { path: string; cell: Cell } => Boolean(x.cell));
    if (!cells.length) return row;
    const ranks = [...RANK, "notCompared" as const];
    const status = ranks.find((rank) =>
      cells.some((x) => x.cell.status === rank),
    )!;
    const values = [...new Set(cells.map((x) => x.cell.value))];
    const value =
      values.length === 1 && row.attribute !== "matchedBy"
        ? values[0]
        : cells
            .map((x) => `${x.path}: ${x.cell.value ?? "not stated"}`)
            .join(" | ");
    const reason = [
      ...new Set(cells.flatMap((x) => (x.cell.reason ? [x.cell.reason] : []))),
    ].join(" ");
    return {
      ...row,
      cells: {
        ...row.cells,
        dat: { status, value, ...(reason ? { reason } : {}) },
      },
    };
  });
  const choiceProblems = choiceValueProblems(
    field,
    field.xml_path
      ? sides.xsd.pair.source.get(fromXmlPath(field.xml_path))
      : undefined,
  );
  if (choiceProblems.length) {
    const options = rows.find((row) => row.attribute === "options");
    if (options)
      options.cells.xsd = {
        ...options.cells.xsd,
        status: "unrecorded",
        reason:
          "The maintained source-binding check reports a choice code outside the linked XSD enumeration.",
      };
  }
  const counts: CategoryCounts = { intentional: 0, upstream: 0, gap: 0 };
  for (const row of rows)
    for (const source of SOURCES)
      if (row.cells[source].status in counts)
        counts[row.cells[source].status as Category]++;
  return { ...base, field, rows, counts };
}

/**
 * Every field of a plan compared with its sources, or null for a form the parity suite does
 * not check. Needs the compiled forms (`npm run compile`) and cached sources
 * (`npm run parity:fetch`).
 */
export async function compareForm<F extends PlanField>(
  plan: Plan<F>,
): Promise<FormComparison<F> | null> {
  const diff = DIFFS.find((d) => d.slug === plan.slug);
  if (!diff) return null;
  const pairs = await formPairs(diff, new Map([[plan.slug, plan]]));
  const { compiled } = pairs;
  const sides: Sides = {
    dat: side(pairs.dat, SPECS.dat),
    xsd: side(pairs.xsd, SPECS.xsd),
    jsonSchema: compiled && side(compiled.jsonSchema, SPECS.jsonSchema),
    uiSchema: compiled && side(compiled.uiSchema, SPECS.uiSchema),
    jsonSchemaVsXsd:
      compiled && side(compiled.jsonSchemaVsXsd, SPECS.jsonSchemaVsXsd),
  };
  const mapping = compiled?.xmlMapping;
  // Every XML comparison shows on one row: the field's XML mapping.
  if (mapping)
    sides.xml = {
      plan: side(mapping.plan, SPECS.xmlMapping, () => "xmlMapping"),
      jsonSchema: side(
        mapping.jsonSchema,
        SPECS.xmlMappingVsJsonSchema,
        () => "xmlMapping",
      ),
      xsd: side(mapping.xsd, SPECS.xmlMappingVsXsd, () => "xmlMapping"),
    };
  const walked = walkFields(plan.children);
  const all = walked.map(({ field }) => field);
  const maxItemsByField = new Map(
    walked.map(({ field, maxItems }) => [field, maxItems]),
  );
  const labels = Object.fromEntries(
    SOURCES.map((source) => [
      source,
      new Map(
        all.flatMap((f) => {
          const key = KEYS[source].key(f);
          return source === "dat" && f.source_bindings
            ? sourceCoordinates(f, maxItemsByField.get(f)!, "dat").map(
                (c) => [c.path, f.label] as const,
              )
            : key
              ? [[key, f.label] as const]
              : [];
        }),
      ),
    ]),
  ) as Record<Source, Map<string, string>>;

  const fields: FieldComparison<F>[] = [];
  const compare = (nodes: PlanNode<F>[], at: number[]): ComparisonNode[] =>
    nodes.map((node, index) => {
      const position = [...at, index];
      if (node.kind === "section") {
        const { children, ...section } = node;
        return {
          kind: "section",
          section,
          children: compare(children, position),
        };
      }
      const field = buildBoundField(
        node,
        maxItemsByField.get(node)!,
        position.join("."),
        sides,
        labels,
      );
      fields.push(field);
      return { kind: "field", id: field.id };
    });
  const children = compare(plan.children ?? [], []);
  return { children, fields };
}
