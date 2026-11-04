import type { Model, Program, Type } from "@typespec/compiler";
import { jsonPropertyName, modelProperties } from "simpler-forms";
import type { SyncOptions } from "./decorators.js";
import { stateKeys } from "./lib.js";

/** `@Sgg.sync`'s options, or undefined when sync does not install this form. */
export const modelSync = (p: Program, model: Model) =>
  p.stateMap(stateKeys.sync).get(model) as SyncOptions | undefined;

/** Whether `type` is an `@Sgg.attachment` question, or a scalar that extends one. */
function isAttachment(p: Program, type: Type): boolean {
  for (
    let scalar = type.kind === "Scalar" ? type : undefined;
    scalar;
    scalar = scalar.baseScalar
  )
    if (p.stateSet(stateKeys.attachment).has(scalar)) return true;
  return false;
}

const ATTACHMENT_RULE = { gg_validation: { rule: "attachment" } };

/**
 * The rule schema the API runs over `model`'s answers: an attachment rule on every answer
 * whose type is an `@Sgg.attachment` question, or a list of them, nested as the answers are.
 * A list of objects holding one is marked `gg_type: "array"`, so the rule runs per item.
 */
export function ruleSchema(
  p: Program,
  model: Model,
  casing: "preserve" | "snake",
  seen: Model[] = [],
): Record<string, unknown> {
  const rules: Record<string, unknown> = {};
  for (const prop of modelProperties(model)) {
    const name = jsonPropertyName(p, prop, casing);
    const type = prop.type;
    const array = type.kind === "Model" && type.indexer?.key.name === "integer";
    const item = array ? type.indexer!.value : type;
    if (isAttachment(p, item)) {
      rules[name] = ATTACHMENT_RULE;
      continue;
    }
    if (item.kind !== "Model" || seen.includes(item)) continue;
    const inner = ruleSchema(p, item, casing, [...seen, model]);
    if (!Object.keys(inner).length) continue;
    rules[name] = array ? { gg_type: "array", ...inner } : inner;
  }
  return rules;
}
