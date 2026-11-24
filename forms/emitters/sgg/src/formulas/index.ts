/*
  simpler-forms' `@Formula` decorators, emitted as the API's `gg_pre_population` rules.

  - index.ts   `Formulas`, which `ruleSchema()` hands each field as it walks the form
  - check.ts   which formulas the API's rules can run
  - paths.ts   an answer's place in the emitted data
  - rules.ts   the API rule for each formula, and the value types it reads
  - order.ts   the order the API runs formulas that read each other
*/
import type { ModelProperty, Program, Type } from "@typespec/compiler";
import {
  formulaBlock,
  formulaBlockFields,
  jsonPropertyName,
  modelProperties,
  propFormula,
  type Formula,
  type FormulaSource,
} from "simpler-forms";

import { reportDiagnostic } from "../lib.js";
import { formulaProblem, populated } from "./check.js";
import { assignOrder, type Calculation } from "./order.js";
import {
  builtFrom,
  listItem,
  origin,
  unindexed,
  valueType,
  type KeyOf,
  type Place,
  type Scope,
} from "./paths.js";
import { apiRule, type Json } from "./rules.js";

export type { Place, Scope } from "./paths.js";

/** A source as the API reads it, as the path matched against other formulas, and its type. */
interface Read {
  path: string;
  ref: string;
  type: Type;
}

/**
 * The formulas in one form. The API runs them in `order` before it validates, so a total of
 * totals runs after the totals it adds up.
 */
export class Formulas {
  private readonly all: Calculation[] = [];
  private readonly key: KeyOf;
  /** Formulas already reported, so a model used at several places reports once. */
  private readonly reported = new Set<ModelProperty>();

  constructor(
    private readonly p: Program,
    casing: "preserve" | "snake",
  ) {
    this.key = (prop) => jsonPropertyName(p, prop, casing);
  }

  /** Return the rule for an answer with a formula, or undefined. A block answer gets `blockRules` instead. */
  rules(prop: ModelProperty, place: Place, scopes: Scope[]): Json | undefined {
    const formula = propFormula(this.p, prop);
    if (!formula || formulaBlock(prop.type)) return undefined;
    if (!this.supported(prop, formula)) return undefined;
    const reads: Read[] = [];
    for (const source of formula.sources) {
      const read = this.read(prop, place, scopes, source, false);
      if (!read) return undefined;
      reads.push(read);
    }
    return this.add(
      prop,
      place,
      apiRule(
        formula.name,
        reads.map((r) => r.path),
      ),
      reads,
    );
  }

  /**
   * Return a rule for each field a block answer calculates, keyed like the block's own
   * rules. Read the sources by absolute path: a field's rule sits inside the block, and the
   * API reads a relative path from the field's parent, which is the block, not its sources.
   */
  blockRules(
    prop: ModelProperty,
    place: Place,
    scopes: Scope[],
  ): Json | undefined {
    const formula = propFormula(this.p, prop);
    const block = formulaBlock(prop.type);
    if (!formula || !block || !this.supported(prop, formula)) return undefined;
    if (place.inList) {
      this.unsupported(
        prop,
        "a block inside a list can't read its sources by absolute path",
      );
      return undefined;
    }
    const bases: Read[] = [];
    for (const source of formula.sources) {
      const read = this.read(prop, place, scopes, source, true);
      if (!read) return undefined;
      bases.push(read);
    }
    const out: Json = {};
    for (const fields of formulaBlockFields(this.p, block)) {
      const keys = fields.map(this.key);
      // A source block can be a copy that renames a field, so key each one from its source.
      const reads = bases.map((b) => {
        const { path, ref } = this.walk(b.type, fields);
        return {
          path: `${b.path}.${path}`,
          ref: `${b.ref}.${ref}`,
          type: b.type,
        };
      });
      let rules = out;
      for (const key of keys.slice(0, -1)) rules = (rules[key] ??= {}) as Json;
      rules[keys.at(-1)!] = this.add(
        prop,
        { ...place, at: [...place.at, ...keys] },
        apiRule(
          formula.name,
          reads.map((r) => r.path),
        ),
        reads,
      );
    }
    return out;
  }

  /** Report a formula on an attachment, whose answer is an upload's id. */
  rejectAttachment(prop: ModelProperty): void {
    if (propFormula(this.p, prop))
      this.unsupported(
        prop,
        "it's an attachment, which the API doesn't calculate",
      );
  }

  /** Set each formula's `order`. Call this after walking the whole form. */
  finish(): void {
    assignOrder(this.all);
  }

  /** Report a formula the API's rules can't run, or one on an answer the API populates. */
  private supported(prop: ModelProperty, formula: Formula): boolean {
    const phase = populated(this.p, prop);
    if (phase) {
      this.once(prop, (target) =>
        reportDiagnostic(this.p, {
          code: "conflicting-formula",
          target,
          format: { name: prop.name, formula: formula.name, phase },
        }),
      );
      return false;
    }
    const problem = formulaProblem(this.p, prop, formula);
    if (problem) this.unsupported(prop, problem);
    return !problem;
  }

  /**
   * Return how the API reads a source from this place. A source on the formula's own model
   * is relative to the formula (`@THIS.…`, or a plain path at the form's root), so each copy
   * of the model reads its own data. A source that starts on a model containing this one is
   * read from the nearest place that model has, by absolute path.
   */
  private read(
    prop: ModelProperty,
    place: Place,
    scopes: Scope[],
    source: FormulaSource,
    absolute: boolean,
  ): Read | undefined {
    const parent = place.at.slice(0, -1);
    if (!source.from) {
      const { path, type } = this.walk(scopes.at(-1)!.model, source.fields);
      const at = [...parent, path].join(".");
      return {
        path: absolute || !parent.length ? at : `@THIS.${path}`,
        ref: unindexed(at),
        type,
      };
    }
    const from = source.from;
    const scope = [...scopes].reverse().find((s) => builtFrom(s.model, from));
    if (!scope) {
      this.unsupported(
        prop,
        `it reads ${from.name}, which doesn't contain it where ${origin(prop).model?.name} is used here`,
      );
      return undefined;
    }
    if (scope.place.inList) {
      this.unsupported(
        prop,
        `it reads ${from.name} from inside a list, which the API can't read by absolute path`,
      );
      return undefined;
    }
    const { path, type } = this.walk(scope.model, source.fields);
    const at = [...scope.place.at, path].join(".");
    return { path: at, ref: unindexed(at), type };
  }

  /**
   * Follow `fields` from `model` as the form uses it, returning the path the API reads and the
   * last field's item type. Key each field as emitted where it's used, since a copy made by
   * `model … is` or a spread can rename a field it repeats.
   */
  private walk(
    model: Type,
    fields: ModelProperty[],
  ): { path: string; ref: string; type: Type } {
    let current = model;
    const keys = fields.map((field) => {
      const used =
        (current.kind === "Model" &&
          modelProperties(current).find((f) => origin(f) === origin(field))) ||
        field;
      current = valueType(used.type);
      return this.key(used) + (listItem(used.type) ? "[*]" : "");
    });
    const path = keys.join(".");
    return { path, ref: unindexed(path), type: current };
  }

  private add(
    prop: ModelProperty,
    place: Place,
    rule: Json,
    reads: Read[],
  ): Json {
    this.all.push({
      prop,
      rule,
      at: unindexed(place.at.join(".")),
      refs: reads.map((r) => r.ref),
    });
    return { gg_pre_population: rule };
  }

  private unsupported(prop: ModelProperty, reason: string): void {
    this.once(prop, (target) =>
      reportDiagnostic(this.p, {
        code: "unsupported-formula",
        target,
        format: { name: prop.name, reason },
      }),
    );
  }

  /** Report a problem with a formula once, however many places its model is used at. */
  private once(
    prop: ModelProperty,
    report: (target: ModelProperty) => void,
  ): void {
    const original = origin(prop);
    if (this.reported.has(original)) return;
    this.reported.add(original);
    report(original);
  }
}
