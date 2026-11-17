import type {
  Model,
  ModelProperty,
  Program,
  Scalar,
  Type,
} from "@typespec/compiler";
import {
  jsonPropertyName,
  modelProperties,
  propCalculationMaterialization,
  propComputed,
  propComputedFrom,
  propEvaluationOrder,
  propTotals,
  typeTags,
} from "simpler-forms";

import { reportDiagnostic } from "./lib.js";

type Json = Record<string, unknown>;

/** The API's rule for each `SimplerForms.Op`. */
const RULE: Record<string, string> = {
  Sum: "sum_monetary",
  Subtract: "subtract_monetary",
  PercentOf: "multiply_by_percentage",
};

/** Where an answer sits in the emitted data: its keys, and whether a list is on the way. */
export interface Place {
  at: string[];
  inList: boolean;
}

/** One emitted calculation, kept so its evaluation order can be set once all are known. */
interface Calculation {
  rule: Json;
  at: string;
  refs: string[];
  order?: number;
}

/**
 * Calculations for one form. The API fills each from other answers before it validates,
 * in `order`, so a total of totals is written after the totals it adds up.
 */
export class Calculations {
  private readonly all: Calculation[] = [];
  private readonly places = new Map<Model, Place>();

  constructor(
    private readonly p: Program,
    private readonly root: Model,
    private readonly casing: "preserve" | "snake",
  ) {
    this.placeModels(root, { at: [], inList: false }, []);
  }

  /** The rules for a `@Validation.computed` or `@Validation.computedFrom` answer, if any. */
  computed(prop: ModelProperty, place: Place): Json | undefined {
    const computed = propComputed(this.p, prop);
    const from = propComputedFrom(this.p, prop);
    if (!computed && !from) return undefined;
    const operator = (computed ?? from)!.operator;
    if (!this.supported(prop, operator)) return undefined;

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
        const resolved = this.resolve(prop, path);
        if (!resolved) return undefined;
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
   * The rules for a `@Validation.totals` answer: one sum per money field of its block,
   * across each source. A source is a list whose entries hold the same block, or a peer
   * holding it. Sources are read by absolute path, so the total can't be inside a list.
   */
  totals(prop: ModelProperty, place: Place): Json | undefined {
    const sources = propTotals(this.p, prop);
    if (!sources) return undefined;
    const block = prop.type;
    if (block.kind !== "Model") return undefined;
    if (place.inList) {
      this.unsupported(
        prop,
        "a total inside a list can't read its sources by absolute path",
      );
      return undefined;
    }
    const out: Json = {};
    for (const field of modelProperties(block).filter((f) =>
      this.isMoney(f.type),
    )) {
      const key = this.key(field);
      const fields: string[] = [];
      for (const source of sources) {
        const at = this.places.get(source.model!);
        if (!at || at.inList) {
          this.unsupported(
            prop,
            `its source ${source.name} isn't at one place in the form`,
          );
          return undefined;
        }
        const base = [...at.at, this.key(source)];
        const item = listItem(source.type);
        if (item) {
          const inner = modelProperties(item).filter((i) => i.type === block);
          if (inner.length !== 1) {
            this.unsupported(
              prop,
              `each ${source.name} entry must hold one ${block.name}`,
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

  /** Sets each calculation's `order` from how many calculations it waits for. */
  finish(): void {
    const byAt = new Map(this.all.map((c) => [c.at, c]));
    const depths = new Map<string, number>();
    const depth = (at: string, visiting: Set<string>): number => {
      const calculation = byAt.get(at);
      if (!calculation) return 0;
      if (depths.has(at)) return depths.get(at)!;
      // A cycle has no order; the API would read whatever is saved.
      if (visiting.has(at)) return 1;
      visiting.add(at);
      const d =
        1 + Math.max(0, ...calculation.refs.map((r) => depth(r, visiting)));
      visiting.delete(at);
      depths.set(at, d);
      return d;
    };
    for (const calculation of this.all) {
      const order = calculation.order ?? depth(calculation.at, new Set());
      if (calculation.order !== undefined || order > 1)
        calculation.rule.order = order;
    }
  }

  private add(
    prop: ModelProperty,
    place: Place,
    operator: string,
    fields: string[],
    refs: string[],
  ): Json {
    const rule: Json = { rule: RULE[operator] };
    if (operator === "PercentOf") {
      rule.amount = fields[0];
      rule.percentage = fields[1];
    } else rule.fields = fields;
    this.all.push({
      rule,
      at: place.at.join("."),
      refs,
      order: propEvaluationOrder(this.p, prop),
    });
    return { gg_pre_population: rule };
  }

  /** Whether the API can calculate this answer, reporting why not when it can't. */
  private supported(prop: ModelProperty, operator: string): boolean {
    if (!RULE[operator]) {
      this.unsupported(prop, `the API has no rule for ${operator}`);
      return false;
    }
    if (operator === "Sum" && this.isCount(prop.type)) {
      this.unsupported(prop, "the API only sums money, not counts");
      return false;
    }
    if (propCalculationMaterialization(this.p, prop))
      this.unsupported(
        prop,
        "the API always writes the result, so @Validation.materializeWhenAnySourcePresent is ignored",
      );
    return true;
  }

  /**
   * A `@Validation.computedFrom` path with each name in its emitted casing. `/` starts at
   * the form, anything else at the calculation's own model. `../` has no API spelling.
   */
  private resolve(
    prop: ModelProperty,
    path: string,
  ): { path: string; absolute: boolean } | undefined {
    if (path.startsWith("../")) {
      this.unsupported(prop, `the API can't read ${path} from a parent`);
      return undefined;
    }
    const absolute = path.startsWith("/");
    let model: Model | undefined = absolute ? this.root : prop.model;
    const parts: string[] = [];
    for (const segment of (absolute ? path.slice(1) : path).split(".")) {
      const [, name, index = ""] = /^([^[]+)(\[.*\])?$/.exec(segment) ?? [];
      const step = model && modelProperties(model).find((s) => s.name === name);
      if (!step) {
        this.unsupported(prop, `${path} doesn't name a field`);
        return undefined;
      }
      parts.push(`${this.key(step)}${index}`);
      const type = listItem(step.type) ?? step.type;
      model = type.kind === "Model" ? type : undefined;
    }
    return { path: parts.join("."), absolute };
  }

  private placeModels(model: Model, place: Place, seen: Model[]): void {
    if (!this.places.has(model)) this.places.set(model, place);
    for (const prop of modelProperties(model)) {
      const item = listItem(prop.type);
      const type = item ?? prop.type;
      if (type.kind !== "Model" || seen.includes(type)) continue;
      this.placeModels(
        type,
        { at: [...place.at, this.key(prop)], inList: place.inList || !!item },
        [...seen, model],
      );
    }
  }

  private key(prop: ModelProperty): string {
    return jsonPropertyName(this.p, prop, this.casing);
  }

  private isMoney(type: Type): boolean {
    return hasTag(this.p, type, "money");
  }

  private isCount(type: Type): boolean {
    return hasTag(this.p, type, "count");
  }

  private unsupported(prop: ModelProperty, reason: string): void {
    reportDiagnostic(this.p, {
      code: "unsupported-calculation",
      target: prop,
      format: { name: prop.name, reason },
    });
  }
}

/** The entry model of a list of objects. */
function listItem(type: Type): Model | undefined {
  if (type.kind !== "Model" || type.indexer?.key.name !== "integer")
    return undefined;
  const item = type.indexer.value;
  return item.kind === "Model" ? item : undefined;
}

/** Whether a question or scalar, or a scalar it extends, has `@Meta.tag(tag)`. */
function hasTag(p: Program, type: Type, tag: string): boolean {
  if (type.kind === "Model") return typeTags(p, type).includes(tag);
  for (
    let s: Scalar | undefined = type.kind === "Scalar" ? type : undefined;
    s;
    s = s.baseScalar
  )
    if (typeTags(p, s).includes(tag)) return true;
  return false;
}

/** A path without list indexes, so a calculation can be matched to the ones it reads. */
const unindexed = (path: string) => path.replace(/\[[^\]]*\]/g, "");
