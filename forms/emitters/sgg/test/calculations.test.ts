import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compile, NodeHost, type Program } from "@typespec/compiler";
import { describe, expect, it } from "vitest";

import { ruleSchema } from "../src/model.js";

const MAIN = fileURLToPath(new URL("../../../specs/main.tsp", import.meta.url));

// The question bank has no shared money or count question yet, so each test declares its own.
const SCALARS = `
@Meta.tag(Catalogue.Tag.money)
scalar Money extends string;
@Meta.tag(Catalogue.Tag.count)
scalar Count extends int32;
model Amounts {
  federal?: Money;
  nonFederal?: Money;
  @Validation.computed(Op.Sum, Amounts.federal, Amounts.nonFederal)
  total?: Money;
}
`;

const programWith = async (source: string) => {
  const dir = await mkdtemp(path.join(tmpdir(), "sgg-calculations-"));
  const entry = path.join(dir, "main.tsp");
  await writeFile(
    entry,
    `import "${MAIN}";\nusing SimplerForms;\nnamespace CalculationTest;\n${SCALARS}\n${source}\n`,
  );
  return compile(NodeHost, entry, { noEmit: true });
};

/** The rule schema of a form model named `Form`, with the diagnostics it reported. */
const emit = async (
  body: string,
  casing: "preserve" | "snake" = "preserve",
) => {
  const p = await programWith(
    `@Meta.form(#{ id: "calculation-test", formName: "Calculation Test" })\nmodel Form {\n${body}\n}`,
  );
  const rules = ruleSchema(p, model(p, "Form"), casing);
  return { p, rules };
};

const model = (p: Program, name: string) =>
  p
    .getGlobalNamespaceType()
    .namespaces.get("CalculationTest")!
    .models.get(name)!;

const messages = (p: Program, code: string) =>
  p.diagnostics
    .filter((d) => d.code === `simpler-forms-sgg/${code}`)
    .map((d) => [d.severity, d.message]);

const sum = (fields: string[], order?: number) => ({
  gg_pre_population: {
    rule: "sum_monetary",
    fields,
    ...(order ? { order } : {}),
  },
});

describe("@Validation.computed", () => {
  it("sums siblings at the form's root by their plain names", async () => {
    const { p, rules } = await emit(`
      a?: Money;
      b?: Money;
      @Validation.computed(Op.Sum, Form.a, Form.b) total?: Money;
    `);
    expect(p.diagnostics).toEqual([]);
    expect(rules).toEqual({ total: sum(["a", "b"]) });
  });

  it("reads siblings inside a nested model as @THIS", async () => {
    const { rules } = await emit(`amounts: Amounts;`, "snake");
    expect(rules).toEqual({
      amounts: { total: sum(["@THIS.federal", "@THIS.non_federal"]) },
    });
  });

  it("applies a calculation in a list entry to each entry", async () => {
    const { rules } = await emit(`rows: Amounts[];`);
    expect(rules).toEqual({
      rows: {
        gg_type: "array",
        total: sum(["@THIS.federal", "@THIS.nonFederal"]),
      },
    });
  });

  it("subtracts the rest of the fields from the first", async () => {
    const { rules } = await emit(`
      budget?: Money;
      spent?: Money;
      @Validation.computed(Op.Subtract, Form.budget, Form.spent) remaining?: Money;
    `);
    expect(rules.remaining).toEqual({
      gg_pre_population: {
        rule: "subtract_monetary",
        fields: ["budget", "spent"],
      },
    });
  });

  it("takes a percentage of an amount", async () => {
    const { rules } = await emit(`
      base?: Money;
      rate?: string;
      @Validation.computed(Op.PercentOf, Form.base, Form.rate) indirect?: Money;
    `);
    expect(rules.indirect).toEqual({
      gg_pre_population: {
        rule: "multiply_by_percentage",
        amount: "base",
        percentage: "rate",
      },
    });
  });
});

describe("@Validation.computedFrom", () => {
  it("reads every entry of a list from an absolute path", async () => {
    const { rules } = await emit(`
      rows: Amounts[];
      @Validation.computedFrom(Op.Sum, "/rows[*].federal") federalTotal?: Money;
    `);
    expect(rules.federalTotal).toEqual(sum(["rows[*].federal"]));
  });
});

describe("@Validation.totals", () => {
  it("sums each money field of the block in each entry of a list", async () => {
    const { rules } = await emit(`
      rows: Row[];
      @Validation.totals(Form.rows) rowTotals: Amounts;
    }
    model Row {
      amounts: Amounts;
    `);
    expect(rules.rowTotals).toEqual({
      federal: sum(["rows[*].amounts.federal"]),
      nonFederal: sum(["rows[*].amounts.nonFederal"]),
      total: sum(["rows[*].amounts.total"], 2),
    });
  });

  it("sums each money field of the block across a list of the block", async () => {
    const { rules } = await emit(`
      rows: Amounts[];
      @Validation.totals(Form.rows) rowTotals: Amounts;
    `);
    expect(rules.rowTotals).toEqual({
      federal: sum(["rows[*].federal"]),
      nonFederal: sum(["rows[*].nonFederal"]),
      total: sum(["rows[*].total"], 2),
    });
  });

  it("sums each money field of the block across peers", async () => {
    const { rules } = await emit(`
      q1: Amounts;
      q2: Amounts;
      @Validation.totals(Form.q1, Form.q2) yearTotals: Amounts;
    `);
    expect(rules.yearTotals).toEqual({
      federal: sum(["q1.federal", "q2.federal"]),
      nonFederal: sum(["q1.nonFederal", "q2.nonFederal"]),
      total: sum(["q1.total", "q2.total"], 2),
    });
  });
});

describe("evaluation order", () => {
  it("orders a calculation after the calculations it reads", async () => {
    const { rules } = await emit(`
      a?: Money;
      @Validation.computed(Op.Sum, Form.a) b?: Money;
      @Validation.computed(Op.Sum, Form.b) c?: Money;
    `);
    expect(rules.b).toEqual(sum(["a"]));
    expect(rules.c).toEqual(sum(["b"], 2));
  });

  it("uses @Validation.evaluationOrder when it's set", async () => {
    const { rules } = await emit(`
      a?: Money;
      @Validation.computed(Op.Sum, Form.a)
      @Validation.evaluationOrder(3)
      b?: Money;
    `);
    expect(rules.b).toEqual(sum(["a"], 3));
  });
});

// A slice of the SF-424A, combining the decorators above: each activity's amounts and their
// total, the same columns totaled across activities, and a few row calculations.
describe("an SF-424A budget", () => {
  it("writes the SF-424A's rule shapes", async () => {
    const { p, rules } = await emit(
      `
      activities: Activity[];
      @Validation.totals(Form.activities)
      activityTotals: Amounts;
      @Validation.computedFrom(Op.Sum, "/activities[*].summary.federal")
      federalTotal?: Money;
      directCharges?: Money;
      indirectRate?: string;
      @Validation.computed(Op.PercentOf, Form.directCharges, Form.indirectRate)
      indirectCharges?: Money;
      @Validation.computed(Op.Subtract, Form.directCharges, Form.indirectCharges)
      @Validation.evaluationOrder(3)
      remaining?: Money;
    }
    model Activity {
      name?: string;
      summary: Amounts;
    `,
      "snake",
    );
    expect(p.diagnostics).toEqual([]);
    expect(rules).toEqual({
      activities: {
        gg_type: "array",
        summary: {
          total: sum(["@THIS.federal", "@THIS.non_federal"]),
        },
      },
      activity_totals: {
        federal: sum(["activities[*].summary.federal"]),
        non_federal: sum(["activities[*].summary.non_federal"]),
        total: sum(["activities[*].summary.total"], 2),
      },
      federal_total: sum(["activities[*].summary.federal"]),
      indirect_charges: {
        gg_pre_population: {
          rule: "multiply_by_percentage",
          amount: "direct_charges",
          percentage: "indirect_rate",
        },
      },
      remaining: {
        gg_pre_population: {
          rule: "subtract_monetary",
          fields: ["direct_charges", "indirect_charges"],
          order: 3,
        },
      },
    });
  });
});

describe("calculations the API can't run", () => {
  it.each([
    [
      "a sum of counts",
      `@Validation.computed(Op.Sum, Form.count) answer?: Count;
       count?: Count;`,
      "the API only sums money, not counts",
    ],
    [
      "a path from the parent",
      `@Validation.computedFrom(Op.Sum, "../other") answer?: Money;`,
      "the API can't read ../other from a parent",
    ],
    [
      "a path that doesn't name a field",
      `@Validation.computedFrom(Op.Sum, "/missing") answer?: Money;`,
      "/missing doesn't name a field",
    ],
  ])("reports %s as an error and skips it", async (_, body, reason) => {
    const { p, rules } = await emit(body);
    expect(rules).toEqual({});
    expect(messages(p, "unsupported-calculation")).toEqual([
      ["error", `answer isn't calculated by the API: ${reason}.`],
    ]);
  });

  it("reports a total inside a list as an error and uses the block's own calculation", async () => {
    const { p, rules } = await emit(`
      q1: Amounts;
      years: Year[];
    }
    model Year {
      @Validation.totals(Form.q1) answer: Amounts;
    `);
    const rowTotal = { total: sum(["@THIS.federal", "@THIS.nonFederal"]) };
    expect(rules).toEqual({
      q1: rowTotal,
      years: { gg_type: "array", answer: rowTotal },
    });
    expect(messages(p, "unsupported-calculation")).toEqual([
      [
        "error",
        "answer isn't calculated by the API: a total inside a list can't read its sources by absolute path.",
      ],
    ]);
  });

  it("warns that @Validation.materializeWhenAnySourcePresent is ignored, and still calculates", async () => {
    const { p, rules } = await emit(`
      a?: Money;
      @Validation.computed(Op.Sum, Form.a)
      @Validation.materializeWhenAnySourcePresent
      answer?: Money;
    `);
    expect(rules.answer).toEqual(sum(["a"]));
    expect(messages(p, "calculation-materialization-ignored")).toEqual([
      [
        "warning",
        "answer is written by the API even when its sources are empty, so @Validation.materializeWhenAnySourcePresent is ignored.",
      ],
    ]);
  });
});
