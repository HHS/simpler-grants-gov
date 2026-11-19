import type { Model, ModelProperty, Type } from "@typespec/compiler";
import { modelProperties } from "simpler-forms";

/** An answer's location in the emitted data: its path, and whether any part of it is a list. */
export interface Place {
  at: string[];
  inList: boolean;
}

/** A property's key in the emitted data, in the form's casing. */
export type KeyOf = (prop: ModelProperty) => string;

/**
 * Map each model to its location in the form, using its first appearance. `@Validation.totals`
 * needs these locations because it reads its sources by absolute path.
 */
export function placeModels(root: Model, key: KeyOf): Map<Model, Place> {
  const places = new Map<Model, Place>();
  const visit = (model: Model, place: Place, seen: Model[]) => {
    if (!places.has(model)) places.set(model, place);
    for (const prop of modelProperties(model)) {
      const item = listItem(prop.type);
      const type = item ?? prop.type;
      if (type.kind !== "Model" || seen.includes(type)) continue;
      visit(
        type,
        { at: [...place.at, key(prop)], inList: place.inList || !!item },
        [...seen, model],
      );
    }
  };
  visit(root, { at: [], inList: false }, []);
  return places;
}

/**
 * Convert a `@Validation.computedFrom` path to the emitted property names. A path that
 * starts with `/` starts at the form; any other path starts at the calculation's own model.
 * Return the reason instead when the API can't read the path, e.g. a `../` path.
 */
export function resolvePath(
  root: Model,
  prop: ModelProperty,
  path: string,
  key: KeyOf,
): { path: string; absolute: boolean } | { unsupported: string } {
  if (path.startsWith("../"))
    return { unsupported: `the API can't read ${path} from a parent` };
  const absolute = path.startsWith("/");
  let model: Model | undefined = absolute ? root : prop.model;
  const parts: string[] = [];
  for (const segment of (absolute ? path.slice(1) : path).split(".")) {
    const [, name, index = ""] = /^([^[]+)(\[.*\])?$/.exec(segment) ?? [];
    const step = model && modelProperties(model).find((s) => s.name === name);
    if (!step) return { unsupported: `${path} doesn't name a field` };
    parts.push(`${key(step)}${index}`);
    const type = listItem(step.type) ?? step.type;
    model = type.kind === "Model" ? type : undefined;
  }
  return { path: parts.join("."), absolute };
}

/** Return the entry model of a list of objects. */
export function listItem(type: Type): Model | undefined {
  if (type.kind !== "Model" || type.indexer?.key.name !== "integer")
    return undefined;
  const item = type.indexer.value;
  return item.kind === "Model" ? item : undefined;
}

/** Remove list indexes from a path, so a calculation can be matched to the calculations it reads. */
export const unindexed = (path: string) => path.replace(/\[[^\]]*\]/g, "");
