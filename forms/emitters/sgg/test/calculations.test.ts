import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compile, NodeHost, type Program } from "@typespec/compiler";
import { describe, expect, it } from "vitest";

import { ruleSchema } from "../src/model.js";

const MAIN = fileURLToPath(new URL("../../../specs/main.tsp", import.meta.url));
const programWith = async (source: string) => {
  const dir = await mkdtemp(path.join(tmpdir(), "sgg-calculations-"));
  const entry = path.join(dir, "main.tsp");
  await writeFile(
    entry,
    `import "${MAIN}";\nusing SimplerForms;\nnamespace CalculationTest;\n${source}\n`,
  );
  return compile(NodeHost, entry, { noEmit: true });
};
const model = (p: Program, name: string) =>
  p
    .getGlobalNamespaceType()
    .namespaces.get("CalculationTest")!
    .models.get(name)!;
const warnings = (p: Program) =>
  p.diagnostics
    .filter((d) => d.code === "simpler-forms-sgg/unsupported-calculation")
    .map((d) => d.message);

// A slice of the SF-424A: each activity's federal and non-federal amounts and their
// total, the same columns totaled across activities, and a few row calculations.
const BUDGET = `
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

model Activity {
  name?: string;
  summary: Amounts;
}

@Meta.form(#{ id: "calculation-test", formName: "Calculation Test" })
model Budget {
  activities: Activity[];
  @Validation.totals(Budget.activities)
  activityTotals: Amounts;
  @Validation.computedFrom(Op.Sum, "/activities[*].summary.federal")
  federalTotal?: Money;
  directCharges?: Money;
  indirectRate?: string;
  @Validation.computed(Op.PercentOf, Budget.directCharges, Budget.indirectRate)
  indirectCharges?: Money;
  @Validation.computed(Op.Subtract, Budget.directCharges, Budget.indirectCharges)
  @Validation.evaluationOrder(3)
  remaining?: Money;
}
`;

describe("calculation rules", () => {
  it("write the SF-424A's rule shapes", async () => {
    const p = await programWith(BUDGET);
    expect(p.diagnostics).toEqual([]);
    expect(ruleSchema(p, model(p, "Budget"), "snake")).toEqual({
      activities: {
        gg_type: "array",
        summary: {
          total: {
            gg_pre_population: {
              rule: "sum_monetary",
              fields: ["@THIS.federal", "@THIS.non_federal"],
            },
          },
        },
      },
      activity_totals: {
        federal: {
          gg_pre_population: {
            rule: "sum_monetary",
            fields: ["activities[*].summary.federal"],
          },
        },
        non_federal: {
          gg_pre_population: {
            rule: "sum_monetary",
            fields: ["activities[*].summary.non_federal"],
          },
        },
        total: {
          gg_pre_population: {
            rule: "sum_monetary",
            fields: ["activities[*].summary.total"],
            order: 2,
          },
        },
      },
      federal_total: {
        gg_pre_population: {
          rule: "sum_monetary",
          fields: ["activities[*].summary.federal"],
        },
      },
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

  it("orders a calculation after the calculations it reads", async () => {
    const p = await programWith(`
      @Meta.tag(Catalogue.Tag.money)
      scalar Money extends string;
      @Meta.form(#{ id: "order-test", formName: "Order Test" })
      model Ordered {
        a?: Money;
        @Validation.computed(Op.Sum, Ordered.a) b?: Money;
        @Validation.computed(Op.Sum, Ordered.b) c?: Money;
      }
    `);
    const rules = ruleSchema(p, model(p, "Ordered"), "preserve");
    expect(rules.b).toEqual({
      gg_pre_population: { rule: "sum_monetary", fields: ["a"] },
    });
    expect(rules.c).toEqual({
      gg_pre_population: { rule: "sum_monetary", fields: ["b"], order: 2 },
    });
  });

  it.each([
    [
      "a sum of counts",
      `@Validation.computed(Op.Sum, Unsupported.count) answer?: Count;
       count?: Count;`,
      "the API only sums money, not counts",
    ],
    [
      "a path from the parent",
      `@Validation.computedFrom(Op.Sum, "../other") answer?: Money;`,
      "the API can't read ../other from a parent",
    ],
  ])("skips %s with a warning", async (_, fields, reason) => {
    const p = await programWith(`
      @Meta.tag(Catalogue.Tag.money)
      scalar Money extends string;
      @Meta.tag(Catalogue.Tag.count)
      scalar Count extends int32;
      @Meta.form(#{ id: "unsupported-test", formName: "Unsupported Test" })
      model Unsupported { ${fields} }
    `);
    expect(ruleSchema(p, model(p, "Unsupported"), "preserve")).toEqual({});
    expect(warnings(p)).toEqual([
      `answer isn't calculated by the API: ${reason}.`,
    ]);
  });
});
