import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { formSchema } from "../site/src/lib/formPlanSchema.ts";

const plan = {
  title: "Example",
  slug: "example",
  status: "prioritized",
  children: [
    {
      kind: "field",
      label: "Amount",
      required: false,
      type: "Decimal amount",
      json_path: "activities[].amount",
    },
  ],
};
const withExample = (data: unknown) => ({
  ...structuredClone(plan),
  examples: [
    { label: "Proposed answers", description: "Illustrative only", data },
  ],
});

describe("plan examples", () => {
  it("accepts partial answers and repeated entries without a compiled spec", () => {
    expect(
      formSchema.parse(withExample({ activities: [] })).spec_id,
    ).toBeUndefined();
    expect(
      formSchema.safeParse(
        withExample({ activities: [{ amount: "1.25" }, { amount: "-2.00" }] }),
      ).success,
    ).toBe(true);
  });

  it.each([
    { legacy_activity_rows: [] },
    { activities: [{ amount: "1.25" }, { unrelated: 2 }] },
    { activities: "not an array" },
    { activities: [{ unknown: {} }] },
    { activities: { amount: "1.25" } },
  ])("rejects answer locations not described by the plan: %j", (data) => {
    const result = formSchema.safeParse(withExample(data));
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0].path).toEqual(["examples", 0, "data"]);
  });

  it("does not claim to validate value constraints or calculations", () => {
    expect(
      formSchema.safeParse(
        withExample({ activities: [{ amount: "not a valid amount" }] }),
      ).success,
    ).toBe(true);
  });

  it("leaves an object-valued field's internal contract to its definition", () => {
    const input = withExample({ document: { id: "illustrative" } });
    input.children[0].json_path = "document";
    expect(formSchema.safeParse(input).success).toBe(true);
  });

  it("rejects non-JSON data", () => {
    expect(
      formSchema.safeParse(withExample({ activities: [{ amount: undefined }] }))
        .success,
    ).toBe(false);
  });

  it("keeps existing SGG fixtures under their pinned source, separate from proposed answers", () => {
    const input = {
      ...structuredClone(plan),
      existing_sgg: {
        source_url: "https://github.com/example/repo/blob/revision/test.py",
        examples: [
          {
            label: "Existing fixture",
            description: "Different contract",
            data: { legacy_activity_rows: [] },
          },
        ],
      },
    };
    expect(formSchema.safeParse(input).success).toBe(true);
    expect(
      formSchema.safeParse({
        ...input,
        existing_sgg: { examples: input.existing_sgg.examples },
      }).success,
    ).toBe(false);
  });
});

it("provides SF-424A samples without defining or compiling the form", () => {
  const plan = formSchema.parse(
    JSON.parse(
      readFileSync(
        new URL(
          "../site/src/content/forms/budget-information-for-non-construction-programs-sf-424a.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ),
  );
  expect(plan.spec_id).toBeUndefined();
  expect(plan.examples).toHaveLength(3);
  expect(plan.existing_sgg?.examples).toHaveLength(2);
  expect(plan.existing_sgg?.source_url).toContain(
    "1858f9a6f7052b101346eada88c9fba95b1ef208",
  );
  const leaves = (value: unknown, path = ""): string[] => {
    if (Array.isArray(value))
      return value.flatMap((entry) => leaves(entry, `${path}[]`));
    if (value !== null && typeof value === "object")
      return Object.entries(value).flatMap(([key, entry]) =>
        leaves(entry, path ? `${path}.${key}` : key),
      );
    return [path];
  };
  const fieldPaths = (nodes: typeof plan.children): string[] =>
    nodes.flatMap((node) =>
      node.kind === "field" ? [node.json_path!] : fieldPaths(node.children),
    );
  expect([...new Set(leaves(plan.examples![1].data))].sort()).toEqual(
    fieldPaths(plan.children).sort(),
  );
});
