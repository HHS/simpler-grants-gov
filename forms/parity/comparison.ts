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
  evaluateForm,
  readRequired,
  walkFields,
  type CompletedCheck,
  type Finding,
  type FormEvaluation,
  type FlatField,
  type Plan,
  type PlanField,
  type PlanNode,
  type PlanSection,
} from "./result.ts";
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
  range: ["minimum", "maximum"],
  options: ["enumType", "enum"],
};

/** The attribute a discrepancy is about, or undefined for one the sheet does not show. */
function attributeOf(dimension: string): Attribute | undefined {
  switch (dimension) {
    case "presence":
      return "matchedBy";
    case "order":
      return "position";
    case "label":
      return "label";
    case "help":
      return "help";
    case "required":
      return "required";
  }
  const keyword = dimension;
  return (Object.keys(KEYWORDS) as Attribute[]).find((attribute) =>
    KEYWORDS[attribute]!.includes(keyword),
  );
}

/** Coverage is declared by the completed check, not inferred from an empty findings list. */
function compares(check: CompletedCheck, attribute: Attribute): boolean {
  if (attribute === "xmlMapping") return check.name.startsWith("xmlMapping");
  const dimension =
    attribute === "matchedBy"
      ? "presence"
      : attribute === "position"
        ? "order"
        : attribute;
  return (
    check.coverage.has(dimension) ||
    (KEYWORDS[attribute] ?? []).some((keyword) => check.coverage.has(keyword))
  );
}

/** Why a source is never compared on an attribute. */
const NOT_COMPARED: Partial<
  Record<Source, Partial<Record<Attribute, string>>>
> = {
  dat: {
    xmlMapping: "The DAT names no XML elements.",
    format:
      "The DAT is compared on maximum length only, not on patterns or formats.",
    range: "The DAT is compared on maximum length only, not on numeric ranges.",
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
  keywords: readonly ("pattern" | "format" | "minimum" | "maximum")[],
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
interface Side extends CompletedCheck {
  found: Map<string, { accepted: Finding[]; unexpected: Finding[] }>;
  sourceOrder: string[];
}

/** Index completed findings for this view's row groups. No comparison or settlement runs here. */
function side(check: CompletedCheck, xml = false): Side {
  const found: Side["found"] = new Map();
  for (const d of check.findings) {
    if (d.status === "stale") continue;
    const attribute = xml ? "xmlMapping" : attributeOf(d.dimension);
    if (!attribute) continue;
    const key = `${d.path}#${attribute}`;
    if (!found.has(key)) found.set(key, { accepted: [], unexpected: [] });
    found
      .get(key)!
      [d.status === "unrecorded" ? "unexpected" : "accepted"].push(d);
  }
  const sourceOrder = [...check.matched]
    .filter(([, target]) => check.source.get(target)?.order !== undefined)
    .sort(
      ([, a], [, b]) =>
        check.source.get(a)!.order! - check.source.get(b)!.order!,
    )
    .map(([path]) => path);
  return { ...check, found, sourceOrder };
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
  const accepted: Finding[] = [];
  let unexpected = false;
  let compared = false;
  for (const s of sides) {
    const path = s && key(s);
    if (!s || !path || !compares(s, attribute)) continue;
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
  const status = RANK.find((rank) => accepted.some((d) => d.status === rank))!;
  const reasons = [...new Set(accepted.map((d) => d.entry!.reason))];
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
    sides.dat.plan.get(keys.dat ?? "") ??
    sides.xsd.plan.get(keys.xsd ?? "") ??
    sides.jsonSchema?.plan.get(keys.form ?? "");
  /** The source's own field matched to this plan field, and the side that matched it. */
  const sourceField = (source: Source, s: Side | undefined) => {
    const key = keys[source];
    const target = key && s?.matched.get(key);
    return target ? s!.source.get(target) : undefined;
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
    ? sides.jsonSchemaVsXsd?.source.get(
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
    ? [...(sides.xml?.plan.source.keys() ?? [])]
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
    const order = [...s.plan]
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
        return showRules(rules, ["minimum", "maximum"]);
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
        return showRules(planFlat, ["minimum", "maximum"]);
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
      const renamed = s.renames?.[key];
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

/**
 * Every field of a plan compared with its sources, or null for a form the parity suite does
 * not check. Needs the compiled forms (`npm run compile`) and cached sources
 * (`npm run parity:fetch`).
 */
export interface InspectedComparison<
  F extends PlanField = PlanField,
> extends FormComparison<F> {
  /** All original check entries, including evidence grouped into table cells. */
  findings: Finding[];
}

/** Pure presentation of completed evidence. The table keeps its existing values and count units. */
export function projectComparison<F extends PlanField = PlanField>(
  evaluation: FormEvaluation,
): InspectedComparison<F> {
  const plan = evaluation.plan as Plan<F>;
  const { checks } = evaluation;
  const sides: Sides = {
    dat: side(checks.dat!),
    xsd: side(checks.xsd!),
    jsonSchema: checks.jsonSchema && side(checks.jsonSchema),
    uiSchema: checks.uiSchema && side(checks.uiSchema),
    jsonSchemaVsXsd: checks.jsonSchemaVsXsd && side(checks.jsonSchemaVsXsd),
  };
  if (checks.xmlMapping)
    sides.xml = {
      plan: side(checks.xmlMapping, true),
      jsonSchema: side(checks.xmlMappingVsJsonSchema!, true),
      xsd: side(checks.xmlMappingVsXsd!, true),
    };
  const all = walkFields(plan.children).map(({ field }) => field);
  const labels = Object.fromEntries(
    SOURCES.map((source) => [
      source,
      new Map(
        all.flatMap((f) => {
          const key = KEYS[source].key(f);
          return key ? [[key, f.label] as const] : [];
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
      const field = buildField(node, position.join("."), sides, labels);
      fields.push(field);
      return { kind: "field", id: field.id };
    });
  const children = compare(plan.children ?? [], []);
  return { children, fields, findings: evaluation.findings };
}

export async function compareForm<F extends PlanField>(
  plan: Plan<F>,
): Promise<InspectedComparison<F> | null> {
  const diff = DIFFS.find((d) => d.slug === plan.slug);
  return diff
    ? projectComparison<F>(
        await evaluateForm(diff, new Map([[plan.slug, plan]])),
      )
    : null;
}
