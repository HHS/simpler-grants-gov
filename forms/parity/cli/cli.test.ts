import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, writeFile, readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { comparePair } from "../harness/compare.ts";
import type { FormCheck } from "../harness/index.ts";
import type { Fields, FormDiff, Registers } from "../harness/model.ts";
import { digest, parse, project, select } from "./index.ts";
import { commit, preview } from "./writer.ts";
import { readRecord, resolve, type StoredForm } from "../diffs/store.ts";

const why = { category: "intentional", reason: "Reviewed wording" } as const;
const fields = (label: string): Fields =>
  new Map([["7-10", { label, rules: {} }]]);
function check(registers: Registers = {}, source = "Street1"): FormCheck {
  const result = comparePair(
    { plan: fields("Street 1"), source: fields(source), registers },
    { subject: "plan", labels: true },
  );
  return {
    requirements: {
      dat: result,
      xsd: comparePair(
        { plan: new Map(), source: new Map(), registers: {} },
        { subject: "plan" },
      ),
    },
    suite: { planProblems: [], indexProblems: [], stale: result.stale },
  };
}
const options = (fingerprint: string) => ({
  comparison: "dat",
  register: "differingLabels",
  key: "7-10",
  expect: fingerprint,
  ...why,
});
const folders: string[] = [];
afterEach(async () => {
  for (const folder of folders.splice(0))
    await rm(folder, { recursive: true, force: true });
});
async function fixture(
  data: StoredForm = { slug: "demo" },
  reasons = { shared: why } as Record<string, typeof why>,
) {
  const folder = await mkdtemp(path.join(os.tmpdir(), "form-cli-"));
  folders.push(folder);
  const file = path.join(folder, "demo.json");
  await writeFile(file, JSON.stringify(data, null, 2) + "\n");
  await writeFile(
    path.join(folder, "reasons.json"),
    JSON.stringify({ notes: "Fixture", reasons }),
  );
  return { folder, file, record: readRecord(file) };
}

describe("maintained findings and selection", () => {
  it("keeps comparison identity, suite issues, unavailable checks and nonduplicate stale rows", () => {
    const diff: FormDiff = {
      slug: "demo",
      dat: { differingLabels: { gone: { plan: "a", source: "b", ...why } } },
    };
    const result = check(diff.dat);
    result.suite.indexProblems.push({ kind: "index defect", path: "bad" });
    const found = project(diff, result);
    expect(found.rows.map((r) => r.status)).toEqual([
      "unrecorded",
      "stale",
      "suite",
    ]);
    expect(found.rows.find((r) => r.status === "stale")?.recordable).toBe(
      false,
    );
    expect(found.notRun).toContain("uiSchema");
    expect(found.rows[0].values).toEqual({
      plan: "Street 1",
      source: "Street1",
    });
  });
  it("pins typed evaluator values, including null, numeric and string-array values", () => {
    for (const [plan, source] of [
      [null, "x"],
      [5, 6],
      [
        ["a", "b"],
        ["b", "c"],
      ],
    ] as const) {
      const result = check();
      result.requirements.dat.fieldLabels = [
        {
          kind: "label differs",
          path: "7-10",
          recordAs: { register: "differingLabels", key: "7-10" },
          values: { plan: plan as never, source: source as never },
        },
      ];
      const rows = project({ slug: "demo" }, result).rows;
      expect(
        select({ slug: "demo" }, rows, options(rows[0].fingerprint)).entry,
      ).toEqual({ plan, source, ...why });
    }
  });
  it("rejects stale values and changed prior human disposition", () => {
    const diff: FormDiff = { slug: "demo" },
      initial = project(diff, check()).rows[0];
    expect(() =>
      select(
        diff,
        project(diff, check({}, "Street One")).rows,
        options(initial.fingerprint),
      ),
    ).toThrow("changed");
    const prior = { plan: "Street 1", source: "Street1", ...why };
    const old: FormDiff = {
      slug: "demo",
      dat: { differingLabels: { "7-10": prior } },
    };
    const recorded = project(old, check(old.dat)).rows[0];
    const changed: FormDiff = {
      slug: "demo",
      dat: {
        differingLabels: {
          "7-10": { ...prior, reason: "Another human decision" },
        },
      },
    };
    expect(() =>
      select(changed, project(changed, check(changed.dat)).rows, {
        ...options(recorded.fingerprint),
        replace: true,
      }),
    ).toThrow("changed");
    expect(
      select(
        old,
        project(old, check(old.dat)).rows,
        options(initial.fingerprint),
      ).noOp,
    ).toBe(true);
  });
  it("binds nonvalue order-position details and status", () => {
    const a = check(),
      b = check();
    const order = (detail: string) => ({
      kind: "out of order",
      path: "x",
      detail,
      recordAs: { register: "outOfOrder" as const, key: "x" },
    });
    a.requirements.dat.fieldLabels = [];
    b.requirements.dat.fieldLabels = [];
    a.requirements.dat.fieldOrder = [
      order("plan position 1, source position 2"),
    ];
    b.requirements.dat.fieldOrder = [
      order("plan position 1, source position 3"),
    ];
    expect(project({ slug: "demo" }, a).rows[0].fingerprint).not.toBe(
      project({ slug: "demo" }, b).rows[0].fingerprint,
    );
  });
  it("retains wholesale wording and requires explicit replacement of changed direct pins", () => {
    const diff: FormDiff = { slug: "demo", wording: { labels: why } };
    const result = check();
    result.requirements.dat = comparePair(
      {
        plan: fields("Street 1"),
        source: fields("Street1"),
        registers: {},
        wording: diff.wording,
      },
      { subject: "plan", labels: true },
    );
    expect(project(diff, result).rows[0].status).toBe("recorded");
    const old: FormDiff = {
      slug: "demo",
      dat: {
        differingLabels: { "7-10": { plan: "Old", source: "Street1", ...why } },
      },
    };
    const rows = project(old, check(old.dat)).rows;
    expect(rows[0].status).toBe("unrecorded");
    expect(() => select(old, rows, options(rows[0].fingerprint))).toThrow(
      "--replace",
    );
    expect(
      select(old, rows, { ...options(rows[0].fingerprint), replace: true })
        .entry.plan,
    ).toBe("Street 1");
  });
  it("rejects unknown flags, invalid categories, duplicates and missing selection metadata", () => {
    for (const args of [
      ["findings", "demo", "--stat", "x"],
      ["accept", "demo"],
      ["findings", "--format", "yaml"],
      ["findings", "demo", "extra"],
      ["findings", "--full", "--full"],
      ["findings", "demo", "--unknown", "--help"],
    ])
      expect(() => parse(args)).toThrow();
  });
});

describe("single authoritative data writer", () => {
  it("refuses the reserved key in selection and persistence", async () => {
    const f = await fixture();
    expect(() =>
      select({ slug: "demo" }, [], {
        ...options("0".repeat(64)),
        key: "__proto__",
      }),
    ).toThrow("reserved __proto__");
    expect(() =>
      preview(
        f.record,
        "dat",
        { register: "absentFromPlan", key: "__proto__" },
        why,
      ),
    ).toThrow("Unsupported record target");
    expect(await readFile(f.file, "utf8")).toBe(f.record.before);
  });

  it("runs the actual Node accept entry point and leaves dry-run inputs untouched", async () => {
    const cli = path.resolve("parity/cli/index.ts");
    const file = path.resolve("parity/diffs/key-contacts.json");
    const before = await readFile(file, "utf8");
    const run = (args: string[]) =>
      JSON.parse(
        execFileSync(process.execPath, [cli, ...args], {
          encoding: "utf8",
          timeout: 30_000,
        }),
      );
    const findings = run([
      "findings",
      "key-contacts",
      "--include-recorded",
      "--format",
      "json",
    ]);
    const finding = findings.findings.find(
      (row: {
        comparison: string;
        recordAs?: { register: string; key: string };
      }) =>
        row.comparison === "dat" &&
        row.recordAs?.register === "differingLabels" &&
        row.recordAs.key === "7-13",
    );
    expect(finding).toBeDefined();
    const result = run([
      "accept",
      "key-contacts",
      "--comparison",
      "dat",
      "--register",
      "differingLabels",
      "--key",
      "7-13",
      "--expect",
      finding.fingerprint,
      "--category",
      "intentional",
      "--reason",
      "CLI subprocess dry-run validation",
      "--replace",
      "--dry-run",
      "--format",
      "json",
    ]);
    expect(result.status).toBe("preview; no authoritative file changed");
    expect(result.entry).toEqual({
      ...finding.values,
      category: "intentional",
      reason: "CLI subprocess dry-run validation",
    });
    expect(await readFile(file, "utf8")).toBe(before);
  });
  it("changes one record, preserves author context and reuses a named reason", async () => {
    const f = await fixture({
      slug: "demo",
      notes: ["Important context"],
      dat: {
        differingLabels: {
          other: { plan: "a", source: "b", reasonRef: "shared" },
        },
      },
    });
    const edit = preview(
      f.record,
      "dat",
      { register: "differingLabels", key: "7-10" },
      { plan: 'a "quote"\nnext', source: null, ...why },
    );
    expect(edit.change.after.reasonRef).toBe("shared");
    await commit(edit, false);
    const actual = readRecord(f.file);
    expect(actual.data.notes).toEqual(["Important context"]);
    expect(actual.data.dat?.differingLabels?.other).toEqual(
      f.record.data.dat?.differingLabels?.other,
    );
    expect(actual.diff.dat?.differingLabels?.["7-10"]).toEqual({
      plan: 'a "quote"\nnext',
      source: null,
      ...why,
    });
    expect(await readFile(actual.reasonFile, "utf8")).toBe(
      f.record.reasonsBefore,
    );
    expect(await readdir(f.folder)).toEqual(["demo.json", "reasons.json"]);
  });
  it("preserves an existing reason alias when another definition has the same text", async () => {
    const f = await fixture(
      {
        slug: "demo",
        dat: {
          differingLabels: {
            x: { plan: "a", source: "b", reasonRef: "local" },
          },
        },
      },
      { shared: why, local: why },
    );
    const record = readRecord(f.file);
    const edit = preview(
      record,
      "dat",
      { register: "differingLabels", key: "x" },
      { plan: "new", source: "b", ...why },
    );
    expect(edit.change.after.reasonRef).toBe("local");
  });
  it("dry-run creates no temporary file, including when missing containers are inserted", async () => {
    const f = await fixture();
    await commit(
      preview(
        f.record,
        "uiSchema",
        { register: "differingHelp", key: "x" },
        { plan: "p", source: "s", ...why },
      ),
      true,
    );
    expect(await readFile(f.file, "utf8")).toBe(f.record.before);
    expect(await readdir(f.folder)).toEqual(["demo.json", "reasons.json"]);
  });
  it.each(["record", "reasons"])(
    "refuses a changed %s without replacing it",
    async (which) => {
      const f = await fixture();
      const edit = preview(
        f.record,
        "dat",
        { register: "outOfOrder", key: "x" },
        why,
      );
      const changed = which === "record" ? f.file : f.record.reasonFile;
      await writeFile(changed, "human edit");
      await expect(commit(edit, false)).rejects.toThrow("changed");
      expect(await readFile(changed, "utf8")).toBe("human edit");
      expect(await readdir(f.folder)).toEqual(["demo.json", "reasons.json"]);
    },
  );
  it("validates malformed data, unknown names, untyped pins and unknown fields", () => {
    for (const data of [
      { slug: "demo", oops: {} },
      {
        slug: "demo",
        dat: {
          differingLabels: {
            x: { reasonRef: "missing", plan: "p", source: "s" },
          },
        },
      },
      {
        slug: "demo",
        dat: {
          differingLabels: {
            x: { reasonRef: "shared", category: "gap", plan: "p", source: "s" },
          },
        },
      },
      {
        slug: "demo",
        dat: {
          differingLabels: { x: { ...why, plan: { bad: true }, source: "s" } },
        },
      },
      {
        slug: "demo",
        dat: {
          differingHelp: {
            x: { category: "typo", reason: "x", plan: null, source: null },
          },
        },
      },
      { slug: "demo", dat: { renamed: { x: { ...why } } } },
    ])
      expect(() => resolve(data, { shared: why })).toThrow();
  });
});

describe("evaluator-owned no-write equivalence", () => {
  it("accepts whitespace-equivalent direct pins without replacing their named decision", () => {
    const diff: FormDiff = {
      slug: "demo",
      dat: {
        differingLabels: {
          "7-10": { plan: "Street   1", source: "Street1", ...why },
        },
      },
    };
    const rows = project(diff, check(diff.dat)).rows;
    expect(select(diff, rows, options("0".repeat(64))).noOp).toBe(true);
  });
  it("accepts reordered enum arrays according to the evaluator", () => {
    const value = (values: string[]): Fields =>
      new Map([["x", { rules: { enum: values } }]]);
    const diff: FormDiff = {
      slug: "demo",
      xsd: {
        differingRules: {
          "x/enum": { plan: ["b", "a"], source: ["d", "c"], ...why },
        },
      },
    };
    const result = check();
    result.requirements.xsd = comparePair(
      {
        plan: value(["a", "b"]),
        source: value(["c", "d"]),
        registers: diff.xsd!,
      },
      { subject: "plan", constraints: { keywords: ["enum"], mode: "equal" } },
    );
    const rows = project(diff, result).rows;
    expect(
      select(diff, rows, {
        ...options("0".repeat(64)),
        comparison: "xsd",
        register: "differingRules",
        key: "x/enum",
      }).noOp,
    ).toBe(true);
  });
  it("does not mistake wholesale wording for an existing direct record", () => {
    const diff: FormDiff = { slug: "demo", wording: { labels: why } };
    const result = check();
    result.requirements.dat = comparePair(
      {
        plan: fields("Street 1"),
        source: fields("Street1"),
        registers: {},
        wording: diff.wording,
      },
      { subject: "plan", labels: true },
    );
    const rows = project(diff, result).rows;
    expect(() => select(diff, rows, options(rows[0].fingerprint))).toThrow(
      "--replace",
    );
    expect(
      select(diff, rows, { ...options(rows[0].fingerprint), replace: true })
        .noOp,
    ).toBe(false);
  });
});
