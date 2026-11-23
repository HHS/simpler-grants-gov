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
 * Rules follow the emitted answer paths and property names, including snake casing.
 * The schema records attachment ownership and pre- or post-population rules.
 * A list of objects uses `gg_type: "array"` so the API applies its rules per item.
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
    const fieldRules: Record<string, unknown> = {};
    const pre = p.stateMap(stateKeys.prePopulation).get(prop);
    const post = p.stateMap(stateKeys.postPopulation).get(prop);
    if (pre) fieldRules.gg_pre_population = { rule: pre };
    if (post) fieldRules.gg_post_population = { rule: post };
    if (isAttachment(p, item)) {
      rules[name] = { ...fieldRules, ...ATTACHMENT_RULE };
      continue;
    }
    if (item.kind === "Model" && !seen.includes(item)) {
      const inner = ruleSchema(p, item, casing, [...seen, model]);
      if (Object.keys(inner).length)
        Object.assign(
          fieldRules,
          array ? { gg_type: "array", ...inner } : inner,
        );
    }
    if (Object.keys(fieldRules).length) rules[name] = fieldRules;
  }
  return rules;
}
