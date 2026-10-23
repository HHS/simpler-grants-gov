import { describe, expect, it } from "vitest";
import { sourceCoordinates } from "./sourceBindings.ts";
import {
  planFields,
  type PlanField,
  type Plan,
} from "./harness/flatten/plan.ts";
const field = (): PlanField => ({
  kind: "field",
  label: "Amount",
  required: false,
  json_path: "activities[].amount",
  xml_path: "Budget/Activity/Amount",
  source_bindings: {
    at: "activities",
    dat: [
      { kind: "slot", path: "A-1", index: 0 },
      { kind: "slot", path: "A-2", index: 1 },
    ],
  },
});
describe("finite DAT slots", () => {
  it("preserves one question while projecting each actual DAT control at occurrence1", () => {
    const f = field(),
      p: Plan = {
        slug: "test",
        children: [
          { kind: "section", label: "Activities", max_items: 2, children: [f] },
        ],
      };
    expect([...planFields(p, "json_path").keys()]).toEqual([
      "activities[].amount",
    ]);
    expect(
      [...planFields(p, "dat_field")].map(([k, v]) => [k, v.rules.maxOccurs]),
    ).toEqual([
      ["A-1", 1],
      ["A-2", 1],
    ]);
    expect(
      planFields(p, "xml_path").get("Budget/Activity/Amount")?.rules.maxOccurs,
    ).toBe(2);
  });
  for (const failure of [
    "missing",
    "duplicate-index",
    "duplicate-path",
    "out-of-range",
    "wrong-owner",
    "shorthand",
    "nested-array",
    "unbounded",
  ] as const)
    it(`refuses ${failure} without emitting partial coordinates`, () => {
      const f = field();
      if (failure === "missing") f.source_bindings!.dat.pop();
      if (failure === "duplicate-index") f.source_bindings!.dat[1].index = 0;
      if (failure === "duplicate-path") f.source_bindings!.dat[1].path = "A-1";
      if (failure === "out-of-range") f.source_bindings!.dat[1].index = 2;
      if (failure === "wrong-owner") f.source_bindings!.at = "unrelated";
      if (failure === "shorthand") f.dat_field = "A-1";
      if (failure === "nested-array")
        f.json_path = "activities[].other[].amount";
      const problems: any[] = [];
      expect(
        sourceCoordinates(
          f,
          failure === "unbounded" ? "unbounded" : 2,
          "dat",
          problems,
        ),
      ).toEqual([]);
      expect(problems.length).toBeGreaterThan(0);
    });
  it("rejects two questions claiming the same source cells", () => {
    const f = field(),
      other = { ...field(), json_path: "activities[].other" };
    const p: Plan = {
      slug: "test",
      children: [
        {
          kind: "section",
          label: "Activities",
          max_items: 2,
          children: [f, other],
        },
      ],
    };
    const problems: any[] = [];
    planFields(p, "dat_field", problems);
    expect(problems.some((p) => p.kind === "duplicate source coordinate")).toBe(
      true,
    );
  });
});
