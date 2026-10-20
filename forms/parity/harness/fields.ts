/** Resolve check evidence to plan fields once. No table value formatting lives here. */
import {
  ATTRIBUTES,
  SOURCES,
  type Attribute,
  type CheckName,
  type FieldResult,
  type Finding,
  type Outcome,
  type Position,
  type Source,
  type Status,
} from "../result.ts";
import type { CompletedCheck } from "./evaluate.ts";
import {
  readRequired,
  type Plan,
  type PlanField,
  type PlanNode,
} from "./flatten/plan.ts";
import { link } from "./flatten/xmlTransform.ts";
import { fromXmlPath } from "./model.ts";

const KEYWORDS: Partial<Record<Attribute, readonly string[]>> = {
  length: ["minLength", "maxLength"],
  format: ["pattern", "format"],
  range: ["minimum", "maximum"],
  options: ["enumType", "enum"],
};
const NAMES: Record<Source, string> = { dat: "DAT", xsd: "XSD", form: "form" };
const KEYS: Record<Source, string> = {
  dat: "DAT field number",
  xsd: "XSD path",
  form: "JSON path",
};
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

interface CheckIndex {
  check: CompletedCheck;
  byPlan: Map<string, Finding[]>;
  bySource: Map<string, Finding[]>;
  planOrder: string[];
  sourceOrder: string[];
}
interface FieldCheck {
  index: CheckIndex;
  key?: string;
  path?: string;
  findings: Finding[];
}

function indexCheck(check: CompletedCheck): CheckIndex {
  const byPlan = new Map<string, Finding[]>(),
    bySource = new Map<string, Finding[]>();
  const add = (
    index: Map<string, Finding[]>,
    path: string,
    finding: Finding,
  ) => {
    if (!index.has(path)) index.set(path, []);
    index.get(path)!.push(finding);
  };
  for (const finding of check.findings) {
    if (finding.status === "stale") continue;
    if (finding.kind === "missing from plan")
      add(bySource, finding.path, finding);
    else {
      add(byPlan, finding.path, finding);
      const source = check.matched.get(finding.path);
      if (source) add(bySource, source, finding);
    }
  }
  return {
    check,
    byPlan,
    bySource,
    planOrder: [...check.plan]
      .filter(([, f]) => f.order !== undefined)
      .sort(([, a], [, b]) => a.order! - b.order!)
      .map(([key]) => key),
    sourceOrder: [...check.matched]
      .filter(([, path]) => check.source.get(path)?.order !== undefined)
      .sort(
        ([, a], [, b]) =>
          check.source.get(a)!.order! - check.source.get(b)!.order!,
      )
      .map(([key]) => key),
  };
}
function fromPlan(
  index: CheckIndex | undefined,
  key: string | undefined,
): FieldCheck | undefined {
  if (!index) return undefined;
  return {
    index,
    key,
    path: key && index.check.matched.get(key),
    findings: key ? (index.byPlan.get(key) ?? []) : [],
  };
}
/** A reverse XML check can be associated through the established source coordinate. */
function fromSource(
  index: CheckIndex | undefined,
  path: string | undefined,
): FieldCheck | undefined {
  if (!index) return undefined;
  return {
    index,
    path,
    findings: path ? (index.bySource.get(path) ?? []) : [],
  };
}
function position(
  sequence: string[],
  key: string | undefined,
  labels: Map<string, string>,
): Position | undefined {
  const at = key ? sequence.indexOf(key) : -1;
  if (at < 0) return undefined;
  const before = sequence[at - 1],
    after = sequence[at + 1];
  return {
    ...(before ? { before: labels.get(before) ?? before } : {}),
    ...(after ? { after: labels.get(after) ?? after } : {}),
  };
}
function covers(check: CompletedCheck, attribute: Attribute): boolean {
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
function concerns(finding: Finding, attribute: Attribute): boolean {
  if (attribute === "xmlMapping") return true;
  const dimension =
    attribute === "matchedBy"
      ? "presence"
      : attribute === "position"
        ? "order"
        : attribute;
  return (
    finding.dimension === dimension ||
    (KEYWORDS[attribute] ?? []).includes(finding.dimension)
  );
}
function judge(
  checks: (FieldCheck | undefined)[],
  attribute: Attribute,
): Outcome {
  const applicable = checks.filter((ref): ref is FieldCheck =>
    Boolean(
      ref &&
      (ref.key || ref.path) &&
      covers(ref.index.check, attribute) &&
      (attribute === "matchedBy" ||
        attribute === "xmlMapping" ||
        (ref.key &&
          ref.index.check.plan.has(ref.key) &&
          ref.index.check.matched.has(ref.key))),
    ),
  );
  const findings = applicable.flatMap((ref) =>
    ref.findings.filter((f) => concerns(f, attribute)),
  );
  if (findings.some((f) => f.status === "unrecorded"))
    return {
      status: "unrecorded",
      reason:
        "The parity tests report this difference, and no record accepts it.",
      findings,
    };
  if (!applicable.length) return { status: "notCompared", findings };
  const status: Status =
    (["gap", "upstream", "intentional"] as const).find((category) =>
      findings.some((f) => f.status === category),
    ) ?? "match";
  const reasons = [
    ...new Set(findings.flatMap((f) => (f.entry ? [f.entry.reason] : []))),
  ];
  return {
    status,
    ...(reasons.length ? { reason: reasons.join(" ") } : {}),
    findings,
  };
}

export function fieldsForForm(
  plan: Plan,
  checks: Partial<Record<CheckName, CompletedCheck>>,
): FieldResult[] {
  const indexes = Object.fromEntries(
    Object.entries(checks).map(([name, check]) => [name, indexCheck(check)]),
  ) as Partial<Record<CheckName, CheckIndex>>;
  const planned: { field: PlanField; id: string }[] = [];
  const walk = (nodes: PlanNode[] = [], at: number[] = []) =>
    nodes.forEach((node, i) => {
      const path = [...at, i];
      if (node.kind === "section") walk(node.children, path);
      else planned.push({ field: node, id: node.json_path ?? path.join(".") });
    });
  walk(plan.children);
  const keysFor = (field: PlanField) => ({
    dat: field.dat_field,
    xsd: field.xml_path ? fromXmlPath(field.xml_path) : undefined,
    form: field.json_path,
  });
  const labels = Object.fromEntries(
    SOURCES.map((source) => [
      source,
      new Map(
        planned.flatMap(({ field }) => {
          const key = keysFor(field)[source];
          return key ? [[key, field.label] as const] : [];
        }),
      ),
    ]),
  ) as Record<Source, Map<string, string>>;
  return planned.map(({ field, id }) => {
    const keys = keysFor(field);
    const direct = {
      dat: fromPlan(indexes.dat, keys.dat),
      xsd: fromPlan(indexes.xsd, keys.xsd),
      form: fromPlan(indexes.jsonSchema, keys.form),
    };
    const ui = fromPlan(indexes.uiSchema, keys.form);
    const schemaPath = direct.form?.path,
      xsdPath = direct.xsd?.path;
    const joined = fromPlan(indexes.jsonSchemaVsXsd, direct.form?.path);
    const xml = [
      fromPlan(
        indexes.xmlMapping,
        keys.form && keys.xsd ? link(keys.form, keys.xsd) : undefined,
      ),
      fromSource(indexes.xmlMappingVsJsonSchema, schemaPath),
      fromSource(indexes.xmlMappingVsXsd, xsdPath),
    ];
    const all = [direct.dat, direct.xsd, direct.form, ui, joined, ...xml];
    const findings = [
      ...new Map(
        all.flatMap((ref) => ref?.findings ?? []).map((f) => [f.id, f]),
      ).values(),
    ];
    const rawPlan =
      direct.dat?.index.check.plan.get(keys.dat ?? "") ??
      direct.xsd?.index.check.plan.get(keys.xsd ?? "") ??
      direct.form?.index.check.plan.get(keys.form ?? "");
    const sources = Object.fromEntries(
      SOURCES.map((source) => {
        const ref = direct[source],
          text = source === "form" ? ui : ref;
        const definition = ref?.path
          ? ref.index.check.source.get(ref.path)
          : undefined;
        const wording = text?.path
          ? text.index.check.source.get(text.path)
          : undefined;
        return [
          source,
          {
            key: keys[source],
            path: ref?.path,
            rules: definition?.rules ?? {},
            required: definition?.required,
            label: wording?.label,
            help: wording?.help,
            position: text?.index.check.coverage.has("order")
              ? position(text.index.sourceOrder, keys[source], labels[source])
              : undefined,
            planPosition:
              text &&
              position(text.index.planOrder, keys[source], labels[source]),
          },
        ];
      }),
    ) as FieldResult["sources"];
    const writtenPaths = schemaPath
      ? [...(indexes.xmlMapping?.check.source.keys() ?? [])]
          .filter((rule) => rule.startsWith(link(schemaPath, "")))
          .map((rule) => rule.slice(link(schemaPath, "").length))
      : [];
    const unused = (reason: string, evidence: Finding[] = []): Outcome => ({
      status: "notCompared",
      reason,
      findings: evidence,
    });
    const outcome = (attribute: Attribute, source: Source): Outcome => {
      const ref = direct[source],
        key = keys[source];
      if (attribute === "xmlMapping") {
        const never = NOT_COMPARED[source]?.xmlMapping;
        if (never) return unused(never);
        if (!indexes.xmlMapping)
          return unused(
            "This form has no XML transform rules yet, so what it writes to XML is not compared.",
          );
        if (!keys.form || !keys.xsd)
          return unused(
            `The plan gives no ${keys.form ? KEYS.xsd : KEYS.form} for this field, so it links it to no element.`,
          );
        return judge(xml, attribute);
      }
      if (!key)
        return unused(`The plan gives no ${KEYS[source]} for this field.`);
      if (!ref) return unused("This form has no compiled spec to compare.");
      const never = NOT_COMPARED[source]?.[attribute];
      if (never) return unused(never);
      const textAttribute =
        attribute === "label" ||
        attribute === "help" ||
        attribute === "position";
      const valueRef = source === "form" && textAttribute ? ui : ref;
      if (attribute !== "matchedBy" && !valueRef?.path)
        return unused(
          source === "form" && textAttribute
            ? "The UI schema has no control matching this field."
            : `The ${NAMES[source]} has no field matching this one.`,
          valueRef?.findings ?? [],
        );
      const applicable =
        source !== "form"
          ? [ref]
          : textAttribute
            ? [ui]
            : attribute === "matchedBy"
              ? [ref]
              : attribute === "options"
                ? [joined]
                : [ref, joined];
      const judged = judge(applicable, attribute);
      if (judged.status === "notCompared")
        return {
          ...judged,
          reason:
            source === "form" && attribute === "options"
              ? "The plan gives no XSD path, so the form's values have no code list to compare with."
              : `The ${NAMES[source]} is not compared on this.`,
        };
      if (
        attribute === "required" &&
        judged.status === "match" &&
        readRequired(field.required) === "conditional"
      )
        return unused(
          `The tests check only that the ${NAMES[source]} does not always require this field. The condition itself waits on the rules-schema check.`,
        );
      if (
        attribute === "matchedBy" &&
        judged.status === "match" &&
        ref.path !== key
      ) {
        const renamed = ref.index.check.renames[key];
        if (renamed)
          return {
            ...judged,
            status: renamed.category,
            reason: renamed.reason,
          };
      }
      if (attribute === "options" && source === "form") {
        const list = (value: unknown) =>
          Array.isArray(value) ? value.map(String) : [];
        const formValues = list(sources.form.rules.enum),
          xsdValues = list(
            joined?.path
              ? joined.index.check.source.get(joined.path)?.rules.enum
              : undefined,
          );
        const missing = xsdValues.filter((v) => !formValues.includes(v)),
          extra = formValues.filter((v) => !xsdValues.includes(v));
        if (missing.length || extra.length) judged.options = { missing, extra };
      }
      return judged;
    };
    return {
      id,
      field,
      plan: {
        ...rawPlan,
        required: readRequired(field.required),
        rules: rawPlan?.rules ?? {},
      },
      sources,
      writtenPaths,
      findings,
      outcomes: Object.fromEntries(
        ATTRIBUTES.map((attribute) => [
          attribute,
          Object.fromEntries(
            SOURCES.map((source) => [source, outcome(attribute, source)]),
          ),
        ]),
      ) as FieldResult["outcomes"],
    };
  });
}
