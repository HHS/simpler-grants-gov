import type { ModelProperty, Program } from "@typespec/compiler";
import { formulaBlock, formulaBlockFields, type Formula } from "simpler-forms";

import { stateKeys } from "../lib.js";
import { listItem, valueType } from "./paths.js";
import { isInteger, isMoney } from "./rules.js";

/**
 * Return why the API can't run a formula, or undefined when it can. simpler-forms has
 * already checked its paths and that a block reads blocks; this checks what the API's rules
 * accept: money, a whole-number percentage, and one amount where a rule reads one.
 */
export function formulaProblem(
  p: Program,
  prop: ModelProperty,
  formula: Formula,
): string | undefined {
  const paths = formula.sources.map((s) => s.fields);
  const named = (fields: ModelProperty[]) =>
    fields.map((f) => f.name).join(".");
  const read = (fields: ModelProperty[]) => valueType(fields.at(-1)!.type);
  const throughList = (fields: ModelProperty[]) =>
    fields.some((f) => listItem(f.type));
  if (formula.name === "subtract" && throughList(paths[0]))
    return `${named(paths[0])} is every item of a list, so there's no one amount to subtract from`;
  const block = formulaBlock(prop.type);
  if (block) {
    for (const fields of formulaBlockFields(p, block)) {
      const field = fields.at(-1)!;
      const name = `${field.model?.name}.${field.name}`;
      if (listItem(field.type))
        return `${name} is a list, which can't be added up field by field`;
      if (!isMoney(p, field.type))
        return `${name} isn't money, so it can't be added up field by field`;
      if (populated(p, field))
        return `${name} is populated by the API, so it can't also be added up`;
    }
    return undefined;
  }
  if (!isMoney(p, prop.type)) return "the API only calculates money";
  if (formula.name === "percentOf") {
    const [amount, percent] = paths;
    if (throughList(amount) || throughList(percent))
      return "percentOf reads one amount and one percentage, not every item of a list";
    if (!isMoney(p, read(amount))) return `${named(amount)} isn't money`;
    if (!isInteger(p, read(percent)))
      return `the percentage ${named(percent)} isn't a whole number`;
    return undefined;
  }
  for (const fields of paths)
    if (!isMoney(p, read(fields))) return `${named(fields)} isn't money`;
  return undefined;
}

/** The population phase of an answer the API fills itself, if it has one. */
export function populated(
  p: Program,
  prop: ModelProperty,
): "pre" | "post" | undefined {
  if (p.stateMap(stateKeys.prePopulation).has(prop)) return "pre";
  if (p.stateMap(stateKeys.postPopulation).has(prop)) return "post";
  return undefined;
}
