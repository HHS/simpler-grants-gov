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
  body = `export const DIFF = { slug: "demo", dat: { differingLabels: {} } };\n`,
) {
  const folder = await mkdtemp(path.join(os.tmpdir(), "form-cli-"));
  folders.push(folder);
  const file = path.join(folder, "demo.ts");
  await writeFile(file, body);
  return { folder, file, body };
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

describe("conservative authoritative TS writer", () => {
  it("runs the actual Node accept entry point and validates a dry-run module without a dependency cycle", async () => {
    const cli = path.resolve("parity/cli/index.ts");
    const file = path.resolve("parity/diffs/key-contacts.ts");
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

  it("inserts one pinned record and preserves bytes outside its AST span and neighboring comments", async () => {
    const f = await fixture(
      `// keep header\nexport const DIFF = { slug: "demo", dat: { differingLabels: { /* neighbor */ "other": { plan: "a", source: "b", category: "gap", reason: "keep" } } } };\n// keep footer\n`,
    );
    const diff: FormDiff = {
      slug: "demo",
      dat: {
        differingLabels: {
          other: { plan: "a", source: "b", category: "gap", reason: "keep" },
        },
      },
    };
    const entry = { plan: 'a "quote"\nnext', source: null, ...why };
    const edit = await preview(
      f.folder,
      diff,
      "dat",
      { register: "differingLabels", key: "7-10" },
      entry,
    );
    const span = edit.edits[0];
    expect(edit.after.startsWith(edit.before.slice(0, span.start))).toBe(true);
    expect(edit.after.endsWith(edit.before.slice(span.end))).toBe(true);
    expect(edit.after).toContain("/* neighbor */");
    await commit(edit, false);
    const actual = JSON.parse(
      execFileSync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          `console.log(JSON.stringify((await import(${JSON.stringify("file://" + f.file)})).DIFF))`,
        ],
        { encoding: "utf8" },
      ),
    );
    expect(Object.hasOwn(actual.dat.differingLabels, "7-10")).toBe(true);
    expect(actual.dat.differingLabels["7-10"]).toEqual(entry);
    expect(actual.dat.differingLabels.other.reason).toBe("keep");
  });
  it("inserts missing literal containers; dry run does not change authoritative bytes", async () => {
    const f = await fixture(`export const DIFF = { slug: "demo" };\n`);
    const edit = await preview(
      f.folder,
      { slug: "demo" },
      "dat",
      { register: "differingLabels", key: "7-10" },
      { plan: "p", source: "s", ...why },
    );
    await commit(edit, true, async () => {});
    expect(await readFile(f.file, "utf8")).toBe(f.body);
    expect(await readdir(f.folder)).toEqual(["demo.ts"]);
  });
  it("replaces one existing initializer without rewriting its surrounding helper or comments", async () => {
    const f = await fixture(
      `const helper = () => ({category:"gap",reason:"old"});\nexport const DIFF = { slug: "demo", dat: { differingLabels: { /* preserve */ "7-10": helper() } } };\n`,
    );
    const edit = await preview(
      f.folder,
      { slug: "demo" },
      "dat",
      { register: "differingLabels", key: "7-10" },
      why,
    );
    expect(edit.after).toContain("const helper = () =>");
    expect(edit.after).toContain("/* preserve */");
    expect(edit.edits).toHaveLength(1);
  });
  it.each([
    `export const DIFF = {slug:"demo", ...{}, dat:{differingLabels:{}}};`,
    `const help={}; export const DIFF = {slug:"demo",dat:{differingLabels:help}};`,
    `export const DIFF = {slug:"demo",dat:{differingLabels:Object.fromEntries([])}};`,
    `export const DIFF = {slug:"demo",dat:{differingLabels:{"x":{},"x":{}}}};`,
  ])("refuses ambiguous/computed storage without changing it", async (body) => {
    const f = await fixture(body);
    await expect(
      preview(
        f.folder,
        { slug: "demo" },
        "dat",
        { register: "differingLabels", key: "x" },
        why,
      ),
    ).rejects.toThrow();
    expect(await readFile(f.file, "utf8")).toBe(body);
  });
  it("refuses the special object-literal __proto__ setter without writing", async () => {
    const f = await fixture();
    await expect(
      preview(
        f.folder,
        { slug: "demo" },
        "dat",
        { register: "differingLabels", key: "__proto__" },
        why,
      ),
    ).rejects.toThrow("reserved __proto__");
    expect(await readFile(f.file, "utf8")).toBe(f.body);
    expect(() =>
      select({ slug: "demo" }, [], {
        ...options("0".repeat(64)),
        key: "__proto__",
      }),
    ).toThrow("reserved __proto__");
  });

  it("refuses concurrent changes and failed candidate validation, cleaning temporary files", async () => {
    const f = await fixture();
    const edit = await preview(
      f.folder,
      { slug: "demo" },
      "dat",
      { register: "differingLabels", key: "x" },
      why,
    );
    await expect(
      commit(edit, false, async () => {
        throw new Error("invalid candidate");
      }),
    ).rejects.toThrow("invalid candidate");
    expect(await readFile(f.file, "utf8")).toBe(f.body);
    await expect(
      commit(edit, false, async () => {
        await writeFile(f.file, "human edit");
      }),
    ).rejects.toThrow("changed");
    expect(await readFile(f.file, "utf8")).toBe("human edit");
    expect(await readdir(f.folder)).toEqual(["demo.ts"]);
  });
});
