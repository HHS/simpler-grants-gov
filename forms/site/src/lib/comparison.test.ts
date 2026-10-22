import { describe, expect, it } from "vitest";

import {
  attributeCounts,
  categoryCounts,
  countsIn,
  defaultCell,
  fieldCount,
  repeatLabel,
  rollupCounts,
  summarize,
  visibleDifferences,
  visibleFields,
  visibleTree,
  type Cell,
  type ComparisonNode,
  type FieldComparison,
  type Status,
  type VisibleNode,
} from "./comparison";

const cell = (status: Status): Cell => ({ status, value: null });

/** A field whose label row has these statuses for the DAT, XSD and form. */
const field = (
  id: string,
  dat: Status,
  xsd: Status = "notCompared",
  form: Status = "match",
) => {
  const statuses = [dat, xsd, form];
  const counts = { gap: 0, upstream: 0, intentional: 0 };
  for (const status of statuses)
    if (status in counts) counts[status as keyof typeof counts] += 1;
  return {
    id,
    field: { kind: "field", label: id, required: false, type: "string" },
    rows: [
      {
        attribute: "matchedBy",
        plan: null,
        cells: { dat: cell("match"), xsd: cell("match"), form: cell("match") },
      },
      {
        attribute: "label",
        plan: id,
        cells: { dat: cell(dat), xsd: cell(xsd), form: cell(form) },
      },
    ],
    counts,
  } as FieldComparison;
};

const MATCHING = field("matching", "match");
const GAP = field("gap", "gap");
const MIXED = field("mixed", "upstream", "notCompared", "intentional");
const FIELDS = [MATCHING, GAP, MIXED];

describe("visibleFields", () => {
  it("shows every field without filter", () => {
    expect(visibleFields(FIELDS, [])).toEqual(FIELDS);
  });

  it("shows fields with any selected category", () => {
    expect(
      visibleFields(FIELDS, ["gap", "intentional"]).map((f) => f.id),
    ).toEqual(["gap", "mixed"]);
  });

  it("shows only matching fields for matches", () => {
    expect(visibleFields(FIELDS, ["matches"]).map((f) => f.id)).toEqual([
      "matching",
    ]);
  });
});

describe("unrecorded differences", () => {
  const BROKEN = field("broken", "unrecorded", "notCompared", "intentional");
  const WITH_BROKEN = [...FIELDS, BROKEN];

  it("are counted beside the recorded categories", () => {
    expect(countsIn(BROKEN)).toEqual({
      unrecorded: 1,
      gap: 0,
      upstream: 0,
      intentional: 1,
    });
  });

  it("select a field under their own filter, and never as matching", () => {
    expect(visibleFields(WITH_BROKEN, ["unrecorded"]).map((f) => f.id)).toEqual(
      ["broken"],
    );
    expect(
      visibleFields(WITH_BROKEN, ["matches"]).map((f) => f.id),
    ).not.toContain("broken");
  });

  it("roll up into their section", () => {
    const SECTION: ComparisonNode = {
      kind: "section",
      section: { kind: "section", label: "Contact" },
      children: WITH_BROKEN.map((f) => ({ kind: "field", id: f.id })),
    };
    const byId = new Map(WITH_BROKEN.map((f) => [f.id, f]));
    expect(rollupCounts(SECTION, byId).unrecorded).toBe(1);
    expect(rollupCounts(SECTION, byId, ["gap"]).unrecorded).toBe(0);
  });

  it("are counted for their tile", () => {
    expect(categoryCounts(WITH_BROKEN).unrecorded).toEqual({
      count: 1,
      fields: 1,
    });
    expect(categoryCounts(FIELDS).unrecorded).toEqual({ count: 0, fields: 0 });
  });
});

describe("visibleTree", () => {
  const section = (
    label: string,
    children: ComparisonNode[],
  ): ComparisonNode => ({
    kind: "section",
    section: { kind: "section", label },
    children,
  });
  const leaf = (id: string): ComparisonNode => ({ kind: "field", id });
  const TREE = [
    leaf("matching"),
    section("Contact", [leaf("gap"), section("Address", [leaf("mixed")])]),
  ];
  const labels = (nodes: VisibleNode[]): unknown[] =>
    nodes.map((node) =>
      node.kind === "field"
        ? node.id
        : { [`${node.section.label} (${node.total})`]: labels(node.children) },
    );

  it("keeps the whole tree when every field is visible", () => {
    expect(
      labels(visibleTree(TREE, new Set(["matching", "gap", "mixed"]))),
    ).toEqual([
      "matching",
      { "Contact (2)": ["gap", { "Address (1)": ["mixed"] }] },
    ]);
  });

  it("drops a section once none of its fields is visible", () => {
    expect(labels(visibleTree(TREE, new Set(["gap"])))).toEqual([
      { "Contact (2)": ["gap"] },
    ]);
  });

  it("keeps the sections leading to a visible nested field", () => {
    expect(labels(visibleTree(TREE, new Set(["mixed"])))).toEqual([
      { "Contact (2)": [{ "Address (1)": ["mixed"] }] },
    ]);
  });

  it("counts the fields under a section at every depth", () => {
    expect(fieldCount(TREE[1])).toBe(2);
  });
});

describe("rollupCounts", () => {
  const CONTACT: ComparisonNode = {
    kind: "section",
    section: { kind: "section", label: "Contact" },
    children: FIELDS.map((f) => ({ kind: "field", id: f.id })),
  };
  const BY_ID = new Map(FIELDS.map((f) => [f.id, f]));

  it("sums every category without a filter", () => {
    expect(rollupCounts(CONTACT, BY_ID)).toEqual({
      unrecorded: 0,
      gap: 1,
      upstream: 1,
      intentional: 1,
    });
  });

  it("sums only the filtered categories", () => {
    expect(rollupCounts(CONTACT, BY_ID, ["gap"])).toEqual({
      unrecorded: 0,
      gap: 1,
      upstream: 0,
      intentional: 0,
    });
  });

  it("sums nothing while only matching fields are shown", () => {
    expect(rollupCounts(CONTACT, BY_ID, ["matches"])).toEqual({
      unrecorded: 0,
      gap: 0,
      upstream: 0,
      intentional: 0,
    });
  });
});

describe("repeatLabel", () => {
  it.each([
    [{}, undefined],
    [{ min_items: 1, max_items: 4 }, "1–4 entries"],
    [{ max_items: 99 }, "Up to 99 entries"],
    [{ min_items: 2, max_items: 2 }, "2 entries"],
    [{ min_items: 1, max_items: "unbounded" as const }, "1 or more entries"],
    [{ max_items: "unbounded" as const }, "Any number of entries"],
  ])("words %j as %s", (node, expected) => {
    expect(repeatLabel(node)).toBe(expected);
  });
});

describe("categoryCounts", () => {
  it("counts differences and fields per category", () => {
    const counts = categoryCounts([...FIELDS, field("two gaps", "gap", "gap")]);
    expect(counts.gap).toEqual({ count: 3, fields: 2 });
    expect(counts.matches).toEqual({ count: 1, fields: 1 });
  });
});

describe("defaultCell", () => {
  it("selects first difference", () => {
    expect(defaultCell(MIXED)).toEqual({ attribute: "label", source: "dat" });
  });

  it("selects nothing for matching field", () => {
    expect(defaultCell(MATCHING)).toBeNull();
  });
});

describe("visibleDifferences", () => {
  it("lists only differing cells", () => {
    expect(visibleDifferences(MIXED, []).map((d) => d.source)).toEqual([
      "dat",
      "form",
    ]);
  });

  it("lists only selected types", () => {
    expect(
      visibleDifferences(MIXED, ["intentional"]).map((d) => d.source),
    ).toEqual(["form"]);
  });

  it("always lists unrecorded differences", () => {
    const broken = field("broken", "unrecorded");
    expect(visibleDifferences(broken, ["gap"])).toHaveLength(1);
  });
});

describe("summarize", () => {
  it("names sources and categories", () => {
    expect(summarize(MIXED)).toBe(
      "Differs from the DAT and the Form in 2 places: 1 upstream, 1 intentional. Every difference is recorded and checked by the parity tests.",
    );
  });

  it("says matching field matches", () => {
    expect(summarize(MATCHING)).toBe(
      "Matches every source it is compared with.",
    );
  });

  it("warns about unrecorded differences", () => {
    expect(summarize(field("broken", "unrecorded"))).toMatch(
      /1 difference is not recorded/,
    );
  });
});

describe("filtering by attribute", () => {
  /** GAP, plus an intentional position difference from the DAT. */
  const MOVED = {
    ...field("moved", "match"),
    rows: [
      ...field("moved", "match").rows,
      {
        attribute: "position",
        plan: null,
        cells: {
          dat: cell("intentional"),
          xsd: cell("notCompared"),
          form: cell("match"),
        },
      },
    ],
    counts: { gap: 0, upstream: 0, intentional: 1 },
  } as FieldComparison;
  const ALL = [...FIELDS, MOVED];

  it("shows fields that differ in a selected attribute", () => {
    expect(visibleFields(ALL, [], ["position"]).map((f) => f.id)).toEqual([
      "moved",
    ]);
  });

  it("combines attributes with categories", () => {
    expect(
      visibleFields(ALL, ["intentional"], ["label"]).map((f) => f.id),
    ).toEqual(["mixed"]);
    expect(
      visibleFields(ALL, ["matches"], ["position"]).map((f) => f.id),
    ).toEqual(["matching", "gap", "mixed"]);
  });

  it("counts each attribute's differences, within the selected categories", () => {
    expect(attributeCounts(ALL)).toEqual([
      { attribute: "label", count: 3, fields: 2 },
      { attribute: "position", count: 1, fields: 1 },
    ]);
    expect(attributeCounts(ALL, ["gap"])).toEqual([
      { attribute: "label", count: 1, fields: 1 },
    ]);
  });

  it("counts categories within the selected attributes", () => {
    expect(categoryCounts(ALL, ["position"]).intentional).toEqual({
      count: 1,
      fields: 1,
    });
    expect(categoryCounts(ALL, ["position"]).gap).toEqual({
      count: 0,
      fields: 0,
    });
  });

  it("sums a section's badges within the selected attributes", () => {
    const SECTION: ComparisonNode = {
      kind: "section",
      section: { kind: "section", label: "All" },
      children: ALL.map((f) => ({ kind: "field", id: f.id })),
    };
    const byId = new Map(ALL.map((f) => [f.id, f]));
    expect(rollupCounts(SECTION, byId, [], ["position"])).toEqual({
      unrecorded: 0,
      gap: 0,
      upstream: 0,
      intentional: 1,
    });
  });
});
