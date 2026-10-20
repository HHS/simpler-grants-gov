import type { Finding } from "@parity/index.ts";
import { describe, expect, it } from "vitest";

import {
  findingCategoryCounts,
  findingDimension,
  findingDimensionCounts,
  visibleFindings,
} from "./findings";

const make = (
  id: string,
  status: Finding["status"],
  dimension: string,
  kind = `${dimension} differs`,
): Finding => ({
  id,
  status,
  dimension,
  kind,
  path: id,
  check: "dat",
  checkTitle: "Plan vs DAT",
  anchors: [{ artifact: "dat", path: id }],
});
const rows = [
  make("first", "gap", "help"),
  make("second", "intentional", "help"),
  make("source-only", "upstream", "presence", "missing from plan"),
  make("left-only", "unrecorded", "presence", "missing from source"),
  {
    ...make("stale", "stale", "record", "stale entry"),
    anchors: [
      {
        artifact: "differenceRecord" as const,
        path: "dat.differingHelp/retired",
      },
    ],
  },
  {
    ...make("suite", "unrecorded", "index", "artifact unavailable"),
    check: "index" as const,
    checkTitle: "Schema index",
    anchors: [],
  },
  make("occurrence", "gap", "maxOccurs"),
];
describe("original-finding filters", () => {
  it("retains identity, ordering and source-only/stale/suite findings without filters", () => {
    const copy = JSON.stringify(rows);
    expect(visibleFindings(rows)).toEqual(rows);
    expect(visibleFindings(rows)[0]).toBe(rows[0]);
    expect(JSON.stringify(rows)).toBe(copy);
  });
  it("uses OR within groups and AND between groups", () => {
    expect(
      visibleFindings(rows, ["gap", "intentional"], ["help", "maxOccurs"]).map(
        (f) => f.id,
      ),
    ).toEqual(["first", "second", "occurrence"]);
    expect(visibleFindings(rows, ["unrecorded"], ["help"])).toEqual([]);
  });
  it("separates missing and extra direction without rewriting raw kinds", () => {
    expect(findingDimension(rows[2])).toBe("missing");
    expect(findingDimension(rows[3])).toBe("extra");
    expect(visibleFindings(rows, [], ["missing"]).map((f) => f.id)).toEqual([
      "source-only",
    ]);
    expect(rows[2].kind).toBe("missing from plan");
  });
  it("reconciles category totals and responds only to dimension filters", () => {
    expect(findingCategoryCounts(rows).reduce((s, x) => s + x.count, 0)).toBe(
      rows.length,
    );
    expect(
      findingCategoryCounts(rows, ["help"]).filter((x) => x.count),
    ).toEqual([
      { category: "gap", count: 1 },
      { category: "intentional", count: 1 },
    ]);
  });
  it("reconciles dimension totals and retains zero-count chips", () => {
    expect(findingDimensionCounts(rows).reduce((s, x) => s + x.count, 0)).toBe(
      rows.length,
    );
    const counts = findingDimensionCounts(rows, ["stale"]);
    expect(counts.find((x) => x.dimension === "record")?.count).toBe(1);
    expect(counts.find((x) => x.dimension === "help")?.count).toBe(0);
  });
  it("does not deduplicate evidence", () => {
    expect(
      visibleFindings([rows[0], { ...rows[0], id: "another-check" }], ["gap"])
        .length,
    ).toBe(2);
  });
  it("handles empty findings and unknown filter selections", () => {
    expect(visibleFindings([], ["gap"], ["help"])).toEqual([]);
    expect(findingDimensionCounts([])).toEqual([]);
    expect(visibleFindings(rows, [], ["not-a-dimension"])).toEqual([]);
  });
});
