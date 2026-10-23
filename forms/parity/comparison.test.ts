import { beforeAll, describe, expect, it } from "vitest";

import {
  compareForm,
  type Attribute,
  type ComparisonNode,
  type FormComparison,
  type Source,
} from "./comparison.ts";
import { DIFFS } from "./diffs/index.ts";
import { loadPlans } from "./harness/index.ts";

const PLANS = loadPlans();

const statusOf = (
  form: FormComparison,
  id: string,
  attribute: Attribute,
  source: Source,
) => {
  const field = form.fields.find((f) => f.id === id);
  return field?.rows.find((row) => row.attribute === attribute)?.cells[source]
    .status;
};

describe("Key Contacts", () => {
  let form: FormComparison;
  beforeAll(async () => {
    form = (await compareForm(PLANS.get("key-contacts")!))!;
  });

  describe("State", () => {
    const id = "key_contacts[].address.state";

    it("DAT label differs upstream", () => {
      expect(statusOf(form, id, "label", "dat")).toBe("upstream");
    });

    it("DAT help differs intentionally", () => {
      expect(statusOf(form, id, "help", "dat")).toBe("intentional");
    });

    it("form options match XSD", () => {
      expect(statusOf(form, id, "options", "form")).toBe("match");
    });

    it("XSD label is not compared", () => {
      expect(statusOf(form, id, "label", "xsd")).toBe("notCompared");
    });
  });

  describe("Phone Number", () => {
    it("form matches it by its path in the key contact", () => {
      expect(statusOf(form, "key_contacts[].phone", "matchedBy", "form")).toBe(
        "match",
      );
    });
  });

  describe("XML mapping", () => {
    const id = "key_contacts[].phone";

    it("form writes the element the plan links", () => {
      expect(statusOf(form, id, "xmlMapping", "form")).toBe("match");
    });

    it("DAT and XSD are not compared", () => {
      expect(statusOf(form, id, "xmlMapping", "dat")).toBe("notCompared");
      expect(statusOf(form, id, "xmlMapping", "xsd")).toBe("notCompared");
    });
  });

  describe("the tree", () => {
    const labels = (nodes: ComparisonNode[]): unknown[] =>
      nodes.flatMap((node) =>
        node.kind === "section"
          ? [{ [node.section.label]: labels(node.children) }]
          : [],
      );

    it("nests sections as the plan does", () => {
      expect(labels(form.children)).toEqual([
        {
          "Key Contacts": [
            {
              "Key Contact": [
                { Role: [] },
                { Name: [] },
                { Address: [] },
                { "Contact Information": [] },
              ],
            },
          ],
        },
      ]);
    });

    it("names every field in the tree by a comparison", () => {
      const ids = (nodes: ComparisonNode[]): string[] =>
        nodes.flatMap((node) =>
          node.kind === "field" ? [node.id] : ids(node.children),
        );
      expect(ids(form.children)).toEqual(form.fields.map((f) => f.id));
    });
  });

  describe("Applicant Organization Name", () => {
    it("matches every source it is compared with", () => {
      const field = form.fields.find(
        (f) => f.id === "applicant_organization_name",
      )!;
      const statuses = new Set(
        field.rows.flatMap((row) =>
          Object.values(row.cells).map((cell) => cell.status),
        ),
      );
      expect([...statuses].sort()).toEqual(["match", "notCompared"]);
    });
  });
});

describe.each(DIFFS)("$slug", (diff) => {
  it("shows no unrecorded differences", async () => {
    const form = (await compareForm(PLANS.get(diff.slug)!))!;
    const unrecorded = form.fields.flatMap((field) =>
      field.rows.flatMap((row) =>
        Object.entries(row.cells)
          .filter(([, cell]) => cell.status === "unrecorded")
          .map(([source]) => `${field.id} ${row.attribute} (${source})`),
      ),
    );
    expect(unrecorded).toEqual([]);
  });
});

describe("form without parity record", () => {
  it("has no comparison", async () => {
    const plan = [...PLANS.values()].find(
      (p) => !DIFFS.some((d) => d.slug === p.slug),
    )!;
    expect(await compareForm(plan)).toBeNull();
  });
});

describe("precision visibility", () => {
  it("shows a precision difference in the existing range row", async () => {
    const plan = structuredClone(PLANS.get("key-contacts")!);
    delete plan.spec_id;
    const { walkFields } = await import("./harness/flatten/plan.ts");
    const field = walkFields(plan.children)[0].field;
    field.constraints = `${field.constraints}, multipleOf 0.01`;
    const comparison = (await compareForm(plan))!;
    const range = comparison.fields[0].rows.find(
      (row) => row.attribute === "range",
    )!;
    expect(range.plan).toContain("multipleOf 0.01");
    expect(range.cells.xsd.status).toBe("unrecorded");
  });
});

describe("SF-424A finite DAT cells", () => {
  const slug = "budget-information-for-non-construction-programs-sf-424a";
  it("shows every source cell for a repeated answer and keeps all four bindings visible", async () => {
    const view = (await compareForm(PLANS.get(slug)!))!;
    const amount = view.fields.find(
      (f) => f.id === "summary.activities[].activity_title",
    )!;
    const cell = amount.rows.find((r) => r.attribute === "matchedBy")!.cells
      .dat;
    for (const id of ["A-1-1", "A-2-1", "A-3-1", "A-4-1"])
      expect(cell.value).toContain(id);
    expect(cell.status).toBe("match");
  });
  it("does not hide an unrecorded difference in the last slot behind matching earlier slots", async () => {
    const diff = DIFFS.find((d) => d.slug === slug)!;
    const entry = diff.dat!.differingLabels!["A-4-1"];
    delete diff.dat!.differingLabels!["A-4-1"];
    try {
      const view = (await compareForm(PLANS.get(slug)!))!;
      const amount = view.fields.find(
        (f) => f.id === "summary.activities[].activity_title",
      )!;
      expect(
        amount.rows.find((r) => r.attribute === "label")!.cells.dat.status,
      ).toBe("unrecorded");
    } finally {
      diff.dat!.differingLabels!["A-4-1"] = entry;
    }
  });
});
