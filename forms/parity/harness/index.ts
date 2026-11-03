/**
 * The harness's entry point: `checkForm` runs every comparison for one form.
 *
 *   load.ts      reads plans, compiled artifacts and cached Grants.gov sources from disk
 *   flatten/     turns each artifact into `Fields`, a map of path -> field (no disk access)
 *   compare.ts   compares two `Fields` maps and applies a form's recorded differences
 *   model.ts     the vocabulary all three share
 */
import {
  comparePair,
  type Pair,
  type PairResult,
  type PairSpec,
} from "./compare.ts";
import { datFields } from "./flatten/dat.ts";
import { indexLeaves, jsonSchemaFields } from "./flatten/jsonSchema.ts";
import { planFields, walkFields, type Plan } from "./flatten/plan.ts";
import { uiSchemaFields } from "./flatten/uiSchema.ts";
import { xsdFields } from "./flatten/xsd.ts";
import { link } from "./flatten/xmlTransform.ts";
import {
  loadFormSchema,
  loadIndex,
  loadPlans,
  loadUiSchema,
  readSource,
} from "./load.ts";
import {
  fromXmlPath,
  type Discrepancy,
  type Fields,
  type FormDiff,
} from "./model.ts";
import { xmlFields, type XmlFormat } from "./xml.ts";

/**
 * What each comparison checks, as the tests name it. The DAT is compared on `maxLength`
 * only (see `datFields`); `enum` is compared only between the two artifacts that list values.
 * JSON schema vs XSD compares only fields the plan links, and lets the schema be stricter.
 * Labels compared with the DAT carry the asterisk it prints on a required field (see
 * `withAsterisk`).
 */
export const SPECS = {
  dat: {
    subject: "plan",
    order: true,
    labels: true,
    help: true,
    constraints: { keywords: ["maxLength"], mode: "equal" },
    occurrences: "equal",
  },
  xsd: {
    subject: "plan",
    constraints: {
      keywords: [
        "minLength",
        "maxLength",
        "pattern",
        "minimum",
        "maximum",
        "enumType",
      ],
      mode: "equal",
    },
    occurrences: "equal",
  },
  jsonSchema: {
    subject: "source",
    constraints: {
      keywords: [
        "minLength",
        "maxLength",
        "pattern",
        "format",
        "minimum",
        "maximum",
      ],
      mode: "equal",
    },
    occurrences: "equal",
  },
  uiSchema: { subject: "source", order: true, labels: true, help: true },
  /** Each field the plan links to an element, mapped to that element. */
  xmlMapping: { subject: "source" },
  xmlMappingVsJsonSchema: { subject: "plan" },
  /** Order too: the API writes elements in rule order, and the XSD is a sequence. */
  xmlMappingVsXsd: { subject: "plan", order: true },
  jsonSchemaVsXsd: {
    subject: "plan",
    fields: false,
    constraints: {
      keywords: [
        "minLength",
        "maxLength",
        "pattern",
        "minimum",
        "maximum",
        "enum",
      ],
      mode: "contains",
    },
    occurrences: "contains",
  },
} satisfies Record<string, PairSpec>;

/** Every comparison for one form, grouped as the tests report them. */
export interface FormCheck {
  requirements: { dat: PairResult; xsd: PairResult };
  /** Absent for a plan without a `spec_id`: there is nothing compiled to check. */
  implementation?: {
    jsonSchema: PairResult;
    uiSchema: PairResult;
    /** Absent for a form with no emitted XML transform. */
    xmlMapping?: PairResult;
  };
  xml?: {
    jsonSchemaVsXsd: PairResult;
    /** Absent for a form with no emitted XML transform. */
    xmlMappingVsJsonSchema?: PairResult;
    xmlMappingVsXsd?: PairResult;
  };
  suite: {
    /** Plan text the suite could not read. */
    planProblems: Discrepancy[];
    /** Leaves of the compiled schema and its `index.json` that do not agree. */
    indexProblems: Discrepancy[];
    /** Recorded differences, from every comparison, that no longer exist. */
    stale: Discrepancy[];
  };
}

const pair = (
  registers: Pair["registers"] = {},
  plan: Fields,
  source: Fields,
): Pair => ({ registers, plan, source });

function required<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`missing ${what}`);
  return value;
}

/**
 * Each XSD field keyed by the compiled-schema path the plan says answers it, beside that
 * schema field, so the two can be compared directly. Fields the plan does not link are left
 * out; the plan-vs-schema and plan-vs-XSD comparisons already report them.
 */
function joinThroughPlan(
  diff: FormDiff,
  plan: Plan,
  schema: Fields,
  xsd: Fields,
) {
  const toSchema = diff.jsonSchema?.renamed ?? {};
  const toXsd = diff.xsd?.renamed ?? {};
  const left: Fields = new Map();
  const right: Fields = new Map();
  for (const { field } of walkFields(plan.children)) {
    if (!field.json_path || !field.xml_path) continue;
    const schemaPath = toSchema[field.json_path]?.to ?? field.json_path;
    const xmlPath = fromXmlPath(field.xml_path);
    const xsdField = xsd.get(toXsd[xmlPath]?.to ?? xmlPath);
    const schemaField = schema.get(schemaPath);
    if (!xsdField || !schemaField) continue;
    left.set(schemaPath, schemaField);
    right.set(schemaPath, xsdField);
  }
  return { left, right };
}

/** The plan's links from a JSON path to an element, keyed as `xmlTransformFields` keys them. */
function planLinks(plan: Plan): Fields {
  const links: Fields = new Map();
  walkFields(plan.children).forEach(({ field }, order) => {
    if (field.json_path && field.xml_path)
      links.set(link(field.json_path, fromXmlPath(field.xml_path)), {
        order,
        rules: {},
      });
  });
  return links;
}

/** Leaves of the walked schema and of `index.json` that the other does not have. */
function indexDisagreements(
  schema: Fields,
  leaves: Set<string>,
): Discrepancy[] {
  return [
    ...[...leaves]
      .filter((path) => !schema.has(path))
      .map((path) => ({ kind: "index leaf missing from schema", path })),
    ...[...schema.keys()]
      .filter((path) => !leaves.has(path))
      .map((path) => ({ kind: "schema leaf missing from index", path })),
  ];
}

/**
 * The plan's labels as the DAT prints them: `* ` before every field the plan requires. Where
 * the asterisk and the plan's requiredness agree, the labels compare as plain text; where
 * they disagree, the label comparison reports it.
 */
const withAsterisk = (fields: Fields): Fields =>
  new Map(
    [...fields].map(([path, field]) => [
      path,
      field.required === "yes" && field.label
        ? { ...field, label: `* ${field.label}` }
        : field,
    ]),
  );

/** One form's plan beside each of its other artifacts, flattened and ready to compare. */
export interface FormPairs {
  plan: Plan;
  /** Plan text the suite could not read. */
  planProblems: Discrepancy[];
  dat: Pair;
  xsd: Pair;
  /** Absent for a plan without a `spec_id`. */
  compiled?: {
    /** The compiled schema's leaves, as walked. */
    schema: Fields;
    jsonSchema: Pair;
    uiSchema: Pair;
    jsonSchemaVsXsd: Pair;
    /** The leaves `index.json` lists. */
    indexLeaves: Set<string>;
    /** Absent for a form with no emitted XML transform. */
    xmlMapping?: { plan: Pair; jsonSchema: Pair; xsd: Pair };
  };
}

/** Which of a form's emitted files to check. */
export interface CheckOptions {
  /** The format the XML mapping is read in. Defaults to the record's, then `xml-transform`. */
  xml?: XmlFormat;
}

/** Reads and flattens every artifact for one form, pairing each with the plan. */
export async function formPairs(
  diff: FormDiff,
  plans: Map<string, Plan> = loadPlans(),
  options: CheckOptions = {},
): Promise<FormPairs> {
  const plan = required(plans.get(diff.slug), `plan with slug ${diff.slug}`);
  const planProblems: Discrepancy[] = [];

  const datSource = datFields(
    readSource(required(plan.dat_url, `dat_url in plan ${diff.slug}`)),
  );
  const xsdSource = xsdFields(
    required(plan.xsd_url, `xsd_url in plan ${diff.slug}`),
    (url) => readSource(url).toString("utf8"),
  );
  const dat = {
    ...pair(
      diff.dat,
      withAsterisk(planFields(plan, "dat_field", planProblems)),
      datSource,
    ),
    wording: diff.wording,
  };
  const xsd = pair(diff.xsd, planFields(plan, "xml_path"), xsdSource);
  if (!plan.spec_id) return { plan, planProblems, dat, xsd };

  const specId = plan.spec_id;
  const schema = jsonSchemaFields(await loadFormSchema(specId));
  const jsonPlan = planFields(plan, "json_path");
  const joined = joinThroughPlan(diff, plan, schema, xsdSource);
  const mapped = xmlFields(specId, options.xml ?? diff.xml);
  return {
    plan,
    planProblems,
    dat,
    xsd,
    compiled: {
      schema,
      jsonSchema: pair(diff.jsonSchema, jsonPlan, schema),
      uiSchema: pair(
        diff.uiSchema,
        jsonPlan,
        uiSchemaFields(loadUiSchema(specId), schema),
      ),
      jsonSchemaVsXsd: pair(diff.jsonSchemaVsXsd, joined.left, joined.right),
      indexLeaves: new Set(indexLeaves(loadIndex(specId))),
      xmlMapping: mapped && {
        plan: pair(diff.xmlMapping, planLinks(plan), mapped.byLink),
        jsonSchema: pair(
          diff.xmlMappingVsJsonSchema,
          mapped.byJsonPath,
          schema,
        ),
        xsd: pair(diff.xmlMappingVsXsd, mapped.byXmlPath, xsdSource),
      },
    },
  };
}

export async function checkForm(
  diff: FormDiff,
  plans: Map<string, Plan> = loadPlans(),
  options: CheckOptions = {},
): Promise<FormCheck> {
  const { planProblems, ...pairs } = await formPairs(diff, plans, options);
  const dat = comparePair(pairs.dat, SPECS.dat);
  const xsd = comparePair(pairs.xsd, SPECS.xsd);
  const requirements = { dat, xsd };
  if (!pairs.compiled)
    return {
      requirements,
      suite: {
        planProblems,
        indexProblems: [],
        stale: [...dat.stale, ...xsd.stale],
      },
    };

  const { compiled } = pairs;
  const jsonSchema = comparePair(compiled.jsonSchema, SPECS.jsonSchema);
  const uiSchema = comparePair(compiled.uiSchema, SPECS.uiSchema);
  const jsonSchemaVsXsd = comparePair(
    compiled.jsonSchemaVsXsd,
    SPECS.jsonSchemaVsXsd,
  );
  const mapping = compiled.xmlMapping;
  const xmlMapping = mapping && comparePair(mapping.plan, SPECS.xmlMapping);
  const xmlMappingVsJsonSchema =
    mapping && comparePair(mapping.jsonSchema, SPECS.xmlMappingVsJsonSchema);
  const xmlMappingVsXsd =
    mapping && comparePair(mapping.xsd, SPECS.xmlMappingVsXsd);

  return {
    requirements,
    implementation: { jsonSchema, uiSchema, xmlMapping },
    xml: { jsonSchemaVsXsd, xmlMappingVsJsonSchema, xmlMappingVsXsd },
    suite: {
      planProblems,
      indexProblems: indexDisagreements(compiled.schema, compiled.indexLeaves),
      stale: [
        dat,
        xsd,
        jsonSchema,
        uiSchema,
        jsonSchemaVsXsd,
        xmlMapping,
        xmlMappingVsJsonSchema,
        xmlMappingVsXsd,
      ].flatMap((result) => result?.stale ?? []),
    },
  };
}

export {
  comparePair,
  matchFields,
  type Accepted,
  type Pair,
  type PairResult,
} from "./compare.ts";
export type {
  MaxItems,
  Plan,
  PlanField,
  PlanNode,
  PlanSection,
} from "./flatten/plan.ts";
export { walkFields } from "./flatten/plan.ts";
export { hasXmlTransform, loadGrantsGovIdentity, loadPlans } from "./load.ts";
export type { XmlFormat } from "./xml.ts";
export {
  report,
  type Discrepancy,
  type Fields,
  type FlatField,
  type FormDiff,
} from "./model.ts";
