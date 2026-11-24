import type { Model, ModelProperty, Type } from "@typespec/compiler";

/** An answer's location in the emitted data: its path, and whether any part of it is a list. */
export interface Place {
  at: string[];
  inList: boolean;
}

/** A model the walk is inside, and where. The last one is the model a field is on. */
export interface Scope {
  model: Model;
  place: Place;
}

/** A property's key in the emitted data, in the form's casing. */
export type KeyOf = (prop: ModelProperty) => string;

/** The property a copy made by `model … is` or a spread was made from. */
export function origin(prop: ModelProperty): ModelProperty {
  while (prop.sourceProperty) prop = prop.sourceProperty;
  return prop;
}

/** Whether `model` is `target`, or was made from it by `is`, a spread or `extends`. */
export function builtFrom(model: Model, target: Model): boolean {
  if (model === target) return true;
  if (model.baseModel && builtFrom(model.baseModel, target)) return true;
  return model.sourceModels.some((s) => builtFrom(s.model, target));
}

/** Return a list's item type. */
export function listItem(type: Type): Type | undefined {
  return type.kind === "Model" && type.indexer?.key.name === "integer"
    ? type.indexer.value
    : undefined;
}

/** Return a field's type, or its item type when it's a list. */
export const valueType = (type: Type): Type => listItem(type) ?? type;

/** Remove list indexes from a path, so a formula can be matched to the formulas it reads. */
export const unindexed = (path: string) => path.replace(/\[[^\]]*\]/g, "");
