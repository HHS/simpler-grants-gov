import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compile, NodeHost, type Program } from "@typespec/compiler";
import { describe, expect, it } from "vitest";

import { ruleSchema } from "../src/model.js";

const MAIN = fileURLToPath(new URL("../../../specs/main.tsp", import.meta.url));

// The question bank has no shared money, count or percentage question yet, so each test
// declares its own. CostRow is the SF-424C's row: a total, the part that isn't allowable,
// and the allowable rest.
const SCALARS = `
@Meta.tag(Catalogue.Tag.money)
scalar Money extends string;
@Meta.tag(Catalogue.Tag.count)
scalar Count extends int32;
scalar Percent extends int32;
model CostRow {
  total?: Money;
  nonAllowable?: Money;
  @Formula.subtract(CostRow.total, CostRow.nonAllowable) allowable?: Money;
}
`;

const programWith = async (source: string) => {
  const dir = await mkdtemp(path.join(tmpdir(), "sgg-formulas-"));
  const entry = path.join(dir, "main.tsp");
  await writeFile(
    entry,
    `import "${MAIN}";\nusing SimplerForms;\nnamespace FormulaTest;\n${SCALARS}\n${source}\n`,
  );
  return compile(NodeHost, entry, { noEmit: true });
};

/** The rule schema of a form model named `Form`, with the diagnostics it reported. */
const emit = async (
  body: string,
  casing: "preserve" | "snake" = "preserve",
) => {
  const p = await programWith(
    `@Meta.form(#{ id: "formula-test", formName: "Formula Test" })\nmodel Form {\n${body}\n}`,
  );
  const rules = ruleSchema(p, model(p, "Form"), casing);
  return { p, rules };
};

const model = (p: Program, name: string) =>
  p.getGlobalNamespaceType().namespaces.get("FormulaTest")!.models.get(name)!;

const messages = (p: Program, code: string) =>
  p.diagnostics
    .filter((d) => d.code === `simpler-forms-sgg/${code}`)
    .map((d) => [d.severity, d.message]);

const rule = (name: string, config: object, order?: number) => ({
  gg_pre_population: { rule: name, ...config, ...(order ? { order } : {}) },
});
const sum = (fields: string[], order?: number) =>
  rule("sum_monetary", { fields }, order);
const subtract = (fields: string[], order?: number) =>
  rule("subtract_monetary", { fields }, order);

const ROW = { allowable: subtract(["@THIS.total", "@THIS.nonAllowable"]) };

/** Check that a formula is reported as one the API can't run, for `reason`. */
const expectUnsupported = async (body: string, reason: string) => {
  const { p } = await emit(body);
  expect(messages(p, "unsupported-formula")).toEqual([
    ["error", `answer isn't calculated by the API: ${reason}.`],
  ]);
};

// Each pattern in the API's hand-written forms (SF-424, SF-424A, SF-424C and the NEH cover
// sheet) is tested under the decorators it uses, named after the form it comes from.
// simpler-forms checks the paths, blocks and loops; these check the rules.
describe("@Formula", () => {
  describe("@Formula.sum", () => {
    it("sums siblings at the form's root by their plain names (SF-424)", async () => {
      const { p, rules } = await emit(`
        federal?: Money;
        applicant?: Money;
        @Formula.sum(Form.federal, Form.applicant) total?: Money;
      `);
      expect(p.diagnostics).toEqual([]);
      expect(rules).toEqual({ total: sum(["federal", "applicant"]) });
    });

    it("adds up every item of a list of amounts", async () => {
      const { p, rules } = await emit(`
        amounts?: Money[];
        @Formula.sum(Form.amounts) total?: Money;
      `);
      expect(p.diagnostics).toEqual([]);
      expect(rules).toEqual({ total: sum(["amounts[*]"]) });
    });

    it("orders a sum after the sums it reads (NEH cover sheet)", async () => {
      const { p, rules } = await emit(`
        outright?: Money;
        match?: Money;
        costSharing?: Money;
        @Formula.sum(Form.outright, Form.match) fromNeh?: Money;
        @Formula.sum(Form.fromNeh, Form.costSharing) projectCosts?: Money;
      `);
      expect(p.diagnostics).toEqual([]);
      expect(rules).toEqual({
        fromNeh: sum(["outright", "match"]),
        projectCosts: sum(["fromNeh", "costSharing"], 2),
      });
    });

    it("copies a field of a model that contains the formula (SF-424C federal funding)", async () => {
      const { p, rules } = await emit(`
        budget?: Budget;
        funding?: Funding;
      }
      model Budget {
        costs?: Money;
      }
      model Funding {
        @Formula.sum([Form.budget, Budget.costs]) projectCosts?: Money;
      `);
      expect(p.diagnostics).toEqual([]);
      expect(rules).toEqual({
        funding: { projectCosts: sum(["budget.costs"]) },
      });
    });

    it("reads a field a copy renames under its new name", async () => {
      const { p, rules } = await emit(`
        row?: RenamedRow;
        @Formula.sum([Form.row, CostRow.total]) rowTotal?: Money;
      }
      model RenamedRow is CostRow;
      @@encodedName(RenamedRow.total, "application/json", "renamedTotal");
      model Unused {
      `);
      expect(p.diagnostics).toEqual([]);
      expect(rules.rowTotal).toEqual(sum(["row.renamedTotal"]));
    });

    it("totals a block across every item of a list (SF-424A)", async () => {
      const { p, rules } = await emit(`
        activities?: Activity[];
        @Formula.sum([Form.activities, Activity.summary]) totalSummary?: Summary;
      }
      model Activity {
        name?: string;
        summary?: Summary;
      }
      model Summary {
        federal?: Money;
        nonFederal?: Money;
      `);
      expect(p.diagnostics).toEqual([]);
      expect(rules).toEqual({
        totalSummary: {
          federal: sum(["activities[*].summary.federal"]),
          nonFederal: sum(["activities[*].summary.nonFederal"]),
        },
      });
    });

    it("leaves out a sum the API can't run", async () => {
      const { rules } = await emit(`
        count?: Count;
        @Formula.sum(Form.count) answer?: Money;
      `);
      expect(rules).toEqual({});
    });

    it.each([
      [
        "a sum of counts",
        `count?: Count;
         @Formula.sum(Form.count) answer?: Money;`,
        "count isn't money",
      ],
      [
        "an answer that isn't money",
        `amount?: Money;
         @Formula.sum(Form.amount) answer?: Count;`,
        "the API only calculates money",
      ],
      [
        "a block with a field that isn't money",
        `note?: Note;
         @Formula.sum(Form.note) answer?: Note;
       }
       model Note {
         amount?: Money;
         comment?: string;`,
        "Note.comment isn't money, so it can't be added up field by field",
      ],
      [
        "a block with a list",
        `rows?: Rows;
         @Formula.sum(Form.rows) answer?: Rows;
       }
       model Rows {
         amounts?: Money[];`,
        "Rows.amounts is a list, which can't be added up field by field",
      ],
      [
        "a block inside a list",
        `years?: Year[];
       }
       model Year {
         q1?: CostRow;
         @Formula.sum(Year.q1) answer?: CostRow;`,
        "a block inside a list can't read its sources by absolute path",
      ],
      [
        "a field of a model that doesn't contain the formula where it's used",
        `inner?: Inner;
         outer?: Outer;
       }
       model Outer {
         amount?: Money;
         inner?: Inner;
       }
       model Inner {
         @Formula.sum([Outer.amount]) answer?: Money;`,
        "it reads Outer, which doesn't contain it where Inner is used here",
      ],
      [
        "a field of a containing model inside a list",
        `items?: Item[];
       }
       model Item {
         amount?: Money;
         inner?: Inner;
       }
       model Inner {
         @Formula.sum(Item.amount) answer?: Money;`,
        "it reads Item from inside a list, which the API can't read by absolute path",
      ],
    ])("reports %s as an error", (_, body, reason) =>
      expectUnsupported(body, reason),
    );
  });

  describe("@Formula.subtract", () => {
    it("reads each copy of a model from that copy (SF-424C rows)", async () => {
      const { p, rules } = await emit(
        `
        landCosts?: CostRow;
        siteWork?: CopiedRow;
        relocation?: SpreadRow;
        otherRows?: CostRow[];
      }
      model CopiedRow is CostRow;
      model SpreadRow {
        ...CostRow;
      `,
        "snake",
      );
      expect(p.diagnostics).toEqual([]);
      const row = {
        allowable: subtract(["@THIS.total", "@THIS.non_allowable"]),
      };
      expect(rules).toEqual({
        land_costs: row,
        site_work: row,
        relocation: row,
        other_rows: { gg_type: "array", ...row },
      });
    });

    it("reads a field a copy renames under its new name", async () => {
      const { p, rules } = await emit(`
        row?: RenamedRow;
      }
      model RenamedRow is CostRow;
      @@encodedName(RenamedRow.total, "application/json", "renamedTotal");
      model Unused {
      `);
      expect(p.diagnostics).toEqual([]);
      expect(rules.row).toEqual({
        allowable: subtract(["@THIS.renamedTotal", "@THIS.nonAllowable"]),
      });
    });

    it.each([
      [
        "a subtraction from every item of a list",
        `bases?: Money[];
         amount?: Money;
         @Formula.subtract(Form.bases, Form.amount) answer?: Money;`,
        "bases is every item of a list, so there's no one amount to subtract from",
      ],
      [
        "a subtraction from every item of a list of blocks",
        `lines?: CostRow[];
         other?: CostRow;
         @Formula.subtract(Form.lines, Form.other) answer?: CostRow;`,
        "lines is every item of a list, so there's no one amount to subtract from",
      ],
    ])("reports %s as an error", (_, body, reason) =>
      expectUnsupported(body, reason),
    );
  });

  describe("@Formula.percentOf", () => {
    it("takes a percentage of a calculated amount (SF-424C federal share)", async () => {
      const { p, rules } = await emit(`
        funding?: Funding;
      }
      model Funding {
        costs?: Money;
        @Formula.sum(Funding.costs) projectCosts?: Money;
        share?: Percent;
        @Formula.percentOf(Funding.projectCosts, Funding.share) federalShare?: Money;
      `);
      expect(p.diagnostics).toEqual([]);
      expect(rules.funding.federalShare).toEqual(
        rule(
          "multiply_by_percentage",
          { amount: "@THIS.projectCosts", percentage: "@THIS.share" },
          2,
        ),
      );
    });

    it.each([
      [
        "a percentage that isn't a whole number",
        `base?: Money;
         rate?: string;
         @Formula.percentOf(Form.base, Form.rate) answer?: Money;`,
        "the percentage rate isn't a whole number",
      ],
      [
        "a percentage of every item of a list",
        `bases?: Money[];
         rate?: Percent;
         @Formula.percentOf(Form.bases, Form.rate) answer?: Money;`,
        "percentOf reads one amount and one percentage, not every item of a list",
      ],
    ])("reports %s as an error", (_, body, reason) =>
      expectUnsupported(body, reason),
    );
  });

  // CostRow subtracts its own allowable cost, so each block of rows below runs that
  // subtraction on its totals.
  describe("@Formula.sum and @Formula.subtract", () => {
    it("works out a block's own formulas from its totals (SF-424A)", async () => {
      const { p, rules } = await emit(`
        lines?: CostRow[];
        @Formula.sum(Form.lines) lineTotals?: CostRow;
      `);
      expect(p.diagnostics).toEqual([]);
      expect(rules).toEqual({
        lines: { gg_type: "array", ...ROW },
        lineTotals: {
          total: sum(["lines[*].total"]),
          nonAllowable: sum(["lines[*].nonAllowable"]),
          allowable: subtract(["@THIS.total", "@THIS.nonAllowable"], 2),
        },
      });
    });

    it("adds peer blocks field by field (SF-424C subtotals)", async () => {
      const { p, rules } = await emit(`
        federal?: CostRow;
        nonFederal?: CostRow;
        @Formula.sum(Form.federal, Form.nonFederal) combined?: CostRow;
      `);
      expect(p.diagnostics).toEqual([]);
      expect(rules.combined).toEqual({
        total: sum(["federal.total", "nonFederal.total"]),
        nonAllowable: sum(["federal.nonAllowable", "nonFederal.nonAllowable"]),
        allowable: subtract(["@THIS.total", "@THIS.nonAllowable"], 2),
      });
    });

    it("subtracts peer blocks field by field (SF-424C total project costs)", async () => {
      const { p, rules } = await emit(`
        costs?: CostRow;
        income?: CostRow;
        @Formula.subtract(Form.costs, Form.income) net?: CostRow;
      `);
      expect(p.diagnostics).toEqual([]);
      expect(rules.net).toEqual({
        total: subtract(["costs.total", "income.total"]),
        nonAllowable: subtract(["costs.nonAllowable", "income.nonAllowable"]),
        allowable: subtract(["@THIS.total", "@THIS.nonAllowable"], 2),
      });
    });

    it("totals the fields a copy renames under their new names", async () => {
      const { p, rules } = await emit(`
        row?: RenamedRow;
        @Formula.sum(Form.row) rowTotals?: CostRow;
      }
      model RenamedRow is CostRow;
      @@encodedName(RenamedRow.total, "application/json", "renamedTotal");
      model Unused {
      `);
      expect(p.diagnostics).toEqual([]);
      expect(rules.rowTotals).toEqual({
        total: sum(["row.renamedTotal"]),
        nonAllowable: sum(["row.nonAllowable"]),
        allowable: subtract(["@THIS.total", "@THIS.nonAllowable"], 2),
      });
    });
  });

  describe("@Formula.sum, subtract and percentOf", () => {
    it("orders an SF-424C budget's formulas after everything they read", async () => {
      const { p, rules } = await emit(`
        budget?: BudgetInformation;
        funding?: FederalFunding;
      }
      model BudgetInformation {
        land?: CostRow;
        siteWork?: CostRow;
        @Formula.sum(BudgetInformation.land, BudgetInformation.siteWork) subtotal?: CostRow;
        contingencies?: CostRow;
        @Formula.sum(BudgetInformation.subtotal, BudgetInformation.contingencies)
        subtotal2?: CostRow;
        income?: CostRow;
        @Formula.subtract(BudgetInformation.subtotal2, BudgetInformation.income)
        projectCosts?: CostRow;
      }
      model FederalFunding {
        @Formula.sum([Form.budget, BudgetInformation.projectCosts, CostRow.allowable])
        projectCosts?: Money;
        share?: Percent;
        @Formula.percentOf(FederalFunding.projectCosts, FederalFunding.share)
        federalShare?: Money;
      `);
      expect(p.diagnostics).toEqual([]);
      const thisRow = (order: number) =>
        subtract(["@THIS.total", "@THIS.nonAllowable"], order);
      expect(rules).toEqual({
        budget: {
          land: ROW,
          siteWork: ROW,
          subtotal: {
            total: sum(["budget.land.total", "budget.siteWork.total"]),
            nonAllowable: sum([
              "budget.land.nonAllowable",
              "budget.siteWork.nonAllowable",
            ]),
            allowable: thisRow(2),
          },
          contingencies: ROW,
          subtotal2: {
            total: sum(
              ["budget.subtotal.total", "budget.contingencies.total"],
              2,
            ),
            nonAllowable: sum(
              [
                "budget.subtotal.nonAllowable",
                "budget.contingencies.nonAllowable",
              ],
              2,
            ),
            allowable: thisRow(3),
          },
          income: ROW,
          projectCosts: {
            total: subtract(
              ["budget.subtotal2.total", "budget.income.total"],
              3,
            ),
            nonAllowable: subtract(
              ["budget.subtotal2.nonAllowable", "budget.income.nonAllowable"],
              3,
            ),
            allowable: thisRow(4),
          },
        },
        funding: {
          projectCosts: sum(["budget.projectCosts.allowable"], 5),
          federalShare: rule(
            "multiply_by_percentage",
            { amount: "@THIS.projectCosts", percentage: "@THIS.share" },
            6,
          ),
        },
      });
    });
  });

  describe("@Formula with @Sgg.prePopulate", () => {
    it("reports a formula on an answer the API populates", async () => {
      const { p } = await emit(`
        amount?: Money;
        @Formula.sum(Form.amount)
        @Sgg.prePopulate(Sgg.PrePopulationRule.agencyName)
        answer?: Money;
      `);
      expect(messages(p, "conflicting-formula")).toEqual([
        [
          "error",
          "answer has both @Formula.sum and @Sgg.prePopulate. Use one or the other.",
        ],
      ]);
    });
  });

  describe("@Formula with @Sgg.attachment", () => {
    it("reports a formula on an attachment", () =>
      expectUnsupported(
        `amount?: Money;
         @Formula.sum(Form.amount) answer?: Upload;
       }
       @Sgg.attachment
       scalar Upload extends string;
       model Unused {`,
        "it's an attachment, which the API doesn't calculate",
      ));
  });
});
