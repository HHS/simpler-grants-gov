import {
  fromXmlPath,
  type Discrepancy,
  type Fields,
  type Requiredness,
  type Rules,
} from "../model.ts";

/** How many entries a repeating node allows. */
export type MaxItems = number | "unbounded";

/** What every node of a form plan (`site/src/content/forms/<slug>.json`) can state. */
interface PlanNodeBase {
  label: string;
  help_text?: string;
  dat_field?: string;
  json_path?: string;
  xml_path?: string;
  /** For a repeating node, how many entries it allows. Unset means exactly one. */
  min_items?: number;
  max_items?: MaxItems;
}

/** The parts of a plan field the suite reads. */
export interface PlanField extends PlanNodeBase {
  kind: "field";
  required: boolean | string;
  constraints?: string;
}

export interface PlanSection<
  F extends PlanField = PlanField,
> extends PlanNodeBase {
  kind: "section";
  children: PlanNode<F>[];
}

export type PlanNode<F extends PlanField = PlanField> = F | PlanSection<F>;

export interface Plan<F extends PlanField = PlanField> {
  slug: string;
  spec_id?: string;
  omb_number?: string;
  /** `MM/DD/YYYY`, as Grants.gov's form listing writes it. */
  expiration_date?: string;
  xsd_url?: string;
  dat_url?: string;
  children?: PlanNode<F>[];
}

/**
 * Every field under `nodes`, depth first in plan order, with how many times it can occur: its
 * own `max_items`, else its nearest repeating ancestor's, else 1.
 */
export function walkFields<F extends PlanField>(
  nodes: PlanNode<F>[] = [],
  inherited: MaxItems = 1,
): { field: F; maxItems: MaxItems }[] {
  return nodes.flatMap((node) =>
    node.kind === "section"
      ? walkFields(node.children, node.max_items ?? inherited)
      : [{ field: node, maxItems: node.max_items ?? inherited }],
  );
}

/** A plan's `required`: a boolean, or text that starts with Yes, No or Conditional. */
export function readRequired(
  required: boolean | string,
): Requiredness | undefined {
  if (typeof required === "boolean") return required ? "yes" : "no";
  const word = /^\s*(yes|no|conditional)\b/i.exec(required)?.[1].toLowerCase();
  return word as Requiredness | undefined;
}

const NUMERIC =
  /^(minLength|maxLength|minimum|maximum|multipleOf)\s+(-?\d+(?:\.\d+)?)$/;

/**
 * A plan's `constraints`, e.g. `minLength 1, maxLength 10` or `StateCodeDataType enumeration`.
 * Returns undefined for anything it cannot read, rather than guessing.
 */
export function readConstraints(text: string): Rules | undefined {
  const rules: Rules = {};
  for (const item of text.split(",").map((part) => part.trim())) {
    let match: RegExpExecArray | null;
    if ((match = NUMERIC.exec(item))) {
      const value = Number(match[2]);
      if (!Number.isFinite(value) || (match[1] === "multipleOf" && value <= 0))
        return undefined;
      rules[match[1] as "minLength"] = value;
    } else if ((match = /^format\s+(\S+)$/.exec(item))) {
      rules.format = match[1];
    } else if ((match = /^pattern\s+(\S+)$/.exec(item))) {
      rules.pattern = match[1];
    } else if ((match = /^(\w+DataType\w*)(?:\s+enumeration)?$/.exec(item))) {
      rules.enumType = match[1];
    } else {
      return undefined;
    }
  }
  return rules;
}

/** Which plan attribute identifies a field in the artifact being compared. */
export type PlanKey = "json_path" | "xml_path" | "dat_field";

/**
 * A plan's fields keyed by one identifier. A field without that identifier is left out, and
 * text the plan states but the suite cannot read is added to `problems`.
 */
export function planFields(
  plan: Plan,
  key: PlanKey,
  problems: Discrepancy[] = [],
): Fields {
  const fields: Fields = new Map();
  walkFields(plan.children).forEach(({ field, maxItems }, order) => {
    const id = field[key];
    if (!id) return;
    const required = readRequired(field.required);
    if (required === undefined)
      problems.push({
        kind: "required unreadable",
        path: id,
        detail: String(field.required),
      });
    const rules = field.constraints ? readConstraints(field.constraints) : {};
    if (rules === undefined)
      problems.push({
        kind: "constraints unreadable",
        path: id,
        detail: field.constraints,
      });
    fields.set(key === "xml_path" ? fromXmlPath(id) : id, {
      order,
      label: field.label,
      help: field.help_text,
      required,
      rules: { ...rules, maxOccurs: maxItems },
    });
  });
  return fields;
}
