/*
  simpler-forms' calculation decorators, emitted as the API's `gg_pre_population` rules.

  - index.ts   `Calculations`, which `ruleSchema()` hands each field as it walks the form
  - rules.ts   the API rule for each operator, and what the API can't calculate
  - paths.ts   an answer's location in the emitted data, and the path a rule uses to read it
  - order.ts   the order the API runs calculations that read each other
*/
import type { Model, ModelProperty, Program } from "@typespec/compiler";
import {
  jsonPropertyName,
  modelProperties,
  propComputed,
  propComputedFrom,
  propEvaluationOrder,
  propTotals,
} from "simpler-forms";

import { assignOrder, type Calculation } from "./order.js";
import {
  listItem,
  placeModels,
  resolvePath,
  unindexed,
  type KeyOf,
  type Place,
} from "./paths.js";
import {
  apiRule,
  isMoney,
  isSupported,
  reportUnsupported,
  type Json,
} from "./rules.js";

export type { Place } from "./paths.js";

/**
 * The calculations in one form. The API runs them in `order` before it validates, so a
 * total of totals runs after the totals it adds up.
 */
export class Calculations {
  private readonly all: Calculation[] = [];
  private readonly places: Map<Model, Place>;
  private readonly key: KeyOf;

  constructor(
    private readonly p: Program,
    private readonly root: Model,
    casing: "preserve" | "snake",
  ) {
    this.key = (prop) => jsonPropertyName(p, prop, casing);
    this.places = placeModels(root, this.key);
  }

  /** Return the rule for a `@Validation.computed` or `@Validation.computedFrom` answer, if it has one. */
  computed(prop: ModelProperty, place: Place): Json | undefined {
    const computed = propComputed(this.p, prop);
    const from = propComputedFrom(this.p, prop);
    if (!computed && !from) return undefined;
    const operator = (computed ?? from)!.operator;
    if (!isSupported(this.p, prop, operator)) return undefined;

    const parent = place.at.slice(0, -1);
    const relative = (path: string) => (parent.length ? `@THIS.${path}` : path);
    const fields: string[] = [];
    const refs: string[] = [];
    if (computed) {
      for (const name of computed.refs) {
        const sibling = modelProperties(prop.model!).find(
          (s) => s.name === name,
        )!;
        const key = this.key(sibling);
        fields.push(relative(key));
        refs.push([...parent, key].join("."));
      }
    } else {
      for (const path of from!.paths) {
        const resolved = resolvePath(this.root, prop, path, this.key);
        if ("unsupported" in resolved) {
          reportUnsupported(this.p, prop, resolved.unsupported);
          return undefined;
        }
        fields.push(
          resolved.absolute ? resolved.path : relative(resolved.path),
        );
        refs.push(
          unindexed(
            resolved.absolute
              ? resolved.path
              : [...parent, resolved.path].join("."),
          ),
        );
      }
    }
    return this.add(prop, place, operator, fields, refs);
  }

  /**
   * Return a sum rule for each money field of a `@Validation.totals` block, across its
   * sources. A source can be a list of the block, a list whose entries contain it, or a
   * peer property of the same type. Read sources by absolute path, which is why a total
   * can't be inside a list.
   */
  totals(prop: ModelProperty, place: Place): Json | undefined {
    const sources = propTotals(this.p, prop);
    if (!sources) return undefined;
    const block = prop.type;
    if (block.kind !== "Model") return undefined;
    if (place.inList) {
      reportUnsupported(
        this.p,
        prop,
        "a total inside a list can't read its sources by absolute path",
      );
      return undefined;
    }
    const out: Json = {};
    for (const field of modelProperties(block).filter((f) =>
      isMoney(this.p, f.type),
    )) {
      const key = this.key(field);
      const fields: string[] = [];
      for (const source of sources) {
        const at = this.places.get(source.model!);
        if (!at || at.inList) {
          reportUnsupported(
            this.p,
            prop,
            `its source ${source.name} isn't at one place in the form`,
          );
          return undefined;
        }
        const base = [...at.at, this.key(source)];
        const item = listItem(source.type);
        // Sum the field across every entry, since each entry is the block itself.
        if (item === block) fields.push(`${base.join(".")}[*].${key}`);
        else if (item) {
          const inner = modelProperties(item).filter((i) => i.type === block);
          if (inner.length !== 1) {
            reportUnsupported(
              this.p,
              prop,
              `each ${source.name} entry must contain exactly one ${block.name}`,
            );
            return undefined;
          }
          fields.push(`${base.join(".")}[*].${this.key(inner[0])}.${key}`);
        } else fields.push([...base, key].join("."));
      }
      out[key] = this.add(
        prop,
        { ...place, at: [...place.at, key] },
        "Sum",
        fields,
        fields.map(unindexed),
      );
    }
    return out;
  }

  /** Set each calculation's `order`. Call this after walking the whole form, since an order depends on every calculation in it. */
  finish(): void {
    assignOrder(this.all);
  }

  private add(
    prop: ModelProperty,
    place: Place,
    operator: string,
    fields: string[],
    refs: string[],
  ): Json {
    const rule = apiRule(operator, fields);
    this.all.push({
      rule,
      at: place.at.join("."),
      refs,
      order: propEvaluationOrder(this.p, prop),
    });
    return { gg_pre_population: rule };
  }
}
