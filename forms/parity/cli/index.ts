/** Thin command adapter over the maintained static parity evaluator. */
import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { FormCheck, PairResult } from "../harness/index.ts";
import { CATEGORIES } from "../harness/model.ts";
import type { Discrepancy, FormDiff, Recorded } from "../harness/model.ts";

const VERSION = "0.1.0";
export const comparisons = [
  "dat",
  "xsd",
  "jsonSchema",
  "uiSchema",
  "jsonSchemaVsXsd",
  "xmlMapping",
  "xmlMappingVsJsonSchema",
  "xmlMappingVsXsd",
] as const;
type Comparison = (typeof comparisons)[number];
type Entry = Recorded & { plan?: unknown; source?: unknown };
export type Finding = Discrepancy & {
  comparison: string;
  status: "unrecorded" | "recorded" | "stale" | "suite";
  entry?: Entry;
  fingerprint: string;
  recordable: boolean;
};
export const stable = (value: unknown): string =>
  JSON.stringify(value, (_key, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.entries(item).sort(([a], [b]) => a.localeCompare(b)),
        )
      : item,
  );
export const digest = (value: unknown): string =>
  createHash("sha256").update(stable(value)).digest("hex");

export function project(diff: FormDiff, check: FormCheck) {
  const pairs: Partial<Record<Comparison, PairResult>> = {
    ...check.requirements,
    ...check.implementation,
    ...check.xml,
  };
  const rows: Finding[] = [];
  const add = (
    comparison: string,
    status: Finding["status"],
    d: Discrepancy,
    accepted?: Entry,
  ) => {
    const register = d.recordAs?.register,
      key = d.recordAs?.key;
    const registers = diff[comparison as Comparison];
    const entry =
      accepted ??
      (register && key ? registers?.[register]?.[key] : undefined) ??
      (comparison === "dat"
        ? d.kind === "label differs"
          ? diff.wording?.labels
          : d.kind === "help differs"
            ? diff.wording?.help
            : undefined
        : undefined);
    const recordable =
      status !== "stale" &&
      status !== "suite" &&
      !!d.recordAs &&
      (!["differingRules", "differingLabels", "differingHelp"].includes(
        register!,
      ) ||
        !!d.values);
    rows.push({
      ...d,
      comparison,
      status,
      entry,
      recordable,
      fingerprint: digest([
        diff.slug,
        comparison,
        register ?? null,
        key ?? d.path,
        d.kind,
        d.values ?? d.detail ?? null,
        status,
        entry ?? null,
      ]),
    });
  };
  for (const comparison of comparisons) {
    const result = pairs[comparison];
    if (!result) continue;
    for (const list of [
      result.missingFields,
      result.extraFields,
      result.fieldOrder,
      result.fieldLabels,
      result.fieldConstraints,
      result.fieldOccurrences,
      result.helpText,
    ])
      for (const d of list) add(comparison, "unrecorded", d);
    for (const d of result.recorded) add(comparison, "recorded", d, d.entry);
    for (const d of result.stale) add(comparison, "stale", d);
  }
  for (const d of check.suite.planProblems)
    add("suite.planProblems", "suite", d);
  for (const d of check.suite.indexProblems)
    add("suite.indexProblems", "suite", d);
  return { rows, notRun: comparisons.filter((key) => !pairs[key]) };
}

export function select(
  diff: FormDiff,
  rows: Finding[],
  options: Record<string, string | boolean>,
) {
  if (options.key === "__proto__")
    throw new Error(
      "The reserved __proto__ dictionary key is unsupported; no record was written.",
    );
  const matches = rows.filter(
    (r) =>
      r.comparison === options.comparison &&
      r.recordAs?.register === options.register &&
      r.recordAs.key === options.key,
  );
  if (matches.length !== 1 || !matches[0].recordable)
    throw new Error(
      "Selection is absent, ambiguous or not recordable; rerun findings --format json.",
    );
  const finding = matches[0];
  const entry: Entry = {
    ...(finding.values ?? {}),
    category: options.category as Recorded["category"],
    reason: options.reason as string,
  };
  const direct =
    diff[finding.comparison as Comparison]?.[finding.recordAs!.register]?.[
      finding.recordAs!.key
    ];
  // A retry may prove the desired direct record already exists; this never writes.
  if (direct && stable(direct) === stable(entry))
    return { finding, entry, noOp: true };
  if (options.expect !== finding.fingerprint)
    throw new Error(
      "Finding or prior disposition changed; rerun findings --format json and review the new fingerprint.",
    );
  if (finding.entry && !options.replace)
    throw new Error(
      "A prior disposition exists; review it and use --replace to explicitly update this entry.",
    );
  return { finding, entry, noOp: false };
}

const help = (command = "form") => ({
  description:
    "Inspect static form parity and record one explicitly reviewed difference. This does not approve a production form.",
  usage:
    command === "accept"
      ? "form accept <plan-slug> --comparison <name> --register <name> --key <key> --expect <fingerprint> --category <upstream|intentional|gap> --reason <text> [--replace] [--dry-run] [--format toon|json]"
      : "form findings [plan-slug] [--comparison <name>] [--full] [--include-recorded] [--format toon|json]",
  deferred:
    "Computed TS registers require a manual edit. Named reasons, prune, adopt-wording and docs updates are not implemented.",
});

export function parse(args: string[]) {
  const askingHelp = args.includes("--help");
  args = args.filter((arg) => arg !== "--help");
  const command = args[0] ?? "findings";
  if (!["findings", "accept"].includes(command))
    throw new Error("Unknown command; use findings or accept.");
  const flags =
    command === "accept"
      ? [
          "comparison",
          "register",
          "key",
          "expect",
          "category",
          "reason",
          "replace",
          "dry-run",
          "format",
        ]
      : ["comparison", "full", "include-recorded", "format"];
  const options: Record<string, string | boolean> = {};
  let form: string | undefined;
  for (let i = 1; i < args.length; i++) {
    const argument = args[i];
    if (!argument.startsWith("--")) {
      if (form) throw new Error("Unexpected positional argument.");
      form = argument;
      continue;
    }
    const key = argument.slice(2);
    if (!flags.includes(key))
      throw new Error(
        `Unknown flag ${argument}; valid flags: ${flags.map((f) => "--" + f).join(", ")}, --help.`,
      );
    if (key in options) throw new Error(`Duplicate flag ${argument}.`);
    if (["replace", "dry-run", "full", "include-recorded"].includes(key))
      options[key] = true;
    else {
      const value = args[++i];
      if (!value || value.startsWith("--"))
        throw new Error(`${argument} requires a value.`);
      options[key] = value;
    }
  }
  if (options.format && !["toon", "json"].includes(String(options.format)))
    throw new Error("--format must be toon or json.");
  if (
    options.comparison &&
    !comparisons.includes(options.comparison as Comparison)
  )
    throw new Error(`Unknown comparison; choose ${comparisons.join(", ")}.`);
  if (askingHelp) return { command: "help", form: command, options };
  if (command === "accept") {
    if (!form) throw new Error("accept requires a plan slug.");
    for (const key of [
      "comparison",
      "register",
      "key",
      "expect",
      "category",
      "reason",
    ])
      if (!options[key]) throw new Error(`accept requires --${key}.`);
    if (!Object.hasOwn(CATEGORIES, String(options.category)))
      throw new Error("--category must be upstream, intentional or gap.");
    if (!String(options.reason).trim())
      throw new Error("--reason must contain an explanation.");
    if (!/^[a-f0-9]{64}$/.test(String(options.expect)))
      throw new Error(
        "--expect must be the full SHA256 fingerprint from findings.",
      );
    if (
      ![
        "absentFromPlan",
        "absentFromSource",
        "differingRules",
        "differingLabels",
        "differingHelp",
        "outOfOrder",
      ].includes(String(options.register))
    )
      throw new Error(
        "Unsupported register; use the finding's recordAs register.",
      );
  }
  return { command, form, options };
}

const quote = (value: unknown) => JSON.stringify(value);
const shellQuote = (value: string) =>
  "'" + value.replaceAll("'", "'\\''") + "'";
function output(data: Record<string, unknown>, json: boolean) {
  if (json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  // Fixed scalar envelope and string-cell table; typed machine records use --format json.
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value) && value.length === 0) console.log(`${key}: []`);
    else if (key === "findings" && Array.isArray(value)) {
      console.log(
        `findings[${value.length}]{comparison,target,status,summary,accept}:`,
      );
      for (const row of value)
        console.log(
          "  " +
            [row.comparison, row.target, row.status, row.summary, row.accept]
              .map(quote)
              .join(","),
        );
    } else if (Array.isArray(value))
      console.log(`${key}[${value.length}]: ${value.map(quote).join(",")}`);
    else console.log(`${key}: ${quote(value)}`);
  }
}

export async function main(args = process.argv.slice(2)): Promise<number> {
  let parsed: ReturnType<typeof parse>;
  try {
    parsed = parse(args);
  } catch (error) {
    output(
      { error: (error as Error).message, help: help(args[0]).usage },
      args.includes("json"),
    );
    return 2;
  }
  const { command, form, options } = parsed;
  if (command === "help") {
    output(help(form), false);
    return 0;
  }
  try {
    const { DIFFS } = await import("../diffs/index.ts");
    if (!form) {
      output(
        {
          bin: path.resolve(process.argv[1]),
          description: help().description,
          forms: DIFFS.map((d) => d.slug),
          help: "npm run --silent form -- findings <plan-slug> --format json",
        },
        options.format === "json",
      );
      return 0;
    }
    const diff = DIFFS.find((d) => d.slug === form);
    if (!diff)
      throw new Error(
        `Unknown plan slug ${form}; run npm run --silent form -- findings to list registered forms.`,
      );
    const { checkForm } = await import("../harness/index.ts");
    const { rows, notRun } = project(diff, await checkForm(diff));
    if (command === "findings") {
      const visible = rows.filter(
        (r) =>
          (r.status !== "recorded" || options["include-recorded"]) &&
          (!options.comparison || r.comparison === options.comparison),
      );
      const common = {
        form,
        unrecorded: visible.filter((r) => r.status === "unrecorded").length,
        stale: visible.filter((r) => r.status === "stale").length,
        suite: visible.filter((r) => r.status === "suite").length,
        notRun,
      };
      if (options.format === "json")
        output({ ...common, findings: visible }, true);
      else {
        const truncated =
          !options.full &&
          visible.some((r) => `${r.kind}: ${r.detail ?? ""}`.length > 200);
        output(
          {
            ...common,
            findings: visible.map((r) => {
              const detail = `${r.kind}: ${r.detail ?? ""}`;
              return {
                comparison: r.comparison,
                target: r.recordAs
                  ? `${r.recordAs.register} ${r.recordAs.key}`
                  : r.path,
                status: r.status,
                summary:
                  !options.full && detail.length > 200
                    ? `${detail.slice(0, 200)}... (truncated; ${detail.length} characters)`
                    : detail,
                accept: r.recordable
                  ? `npm run --silent form -- accept ${shellQuote(form)} --comparison ${shellQuote(r.comparison)} --register ${shellQuote(r.recordAs!.register)} --key ${shellQuote(r.recordAs!.key)} --expect ${shellQuote(r.fingerprint)} --category '<category>' --reason '<reviewed explanation>'`
                  : "not recordable",
              };
            }),
            ...(truncated
              ? {
                  help: `npm run --silent form -- findings ${shellQuote(form)} --full`,
                }
              : {}),
          },
          false,
        );
      }
      return 0;
    }
    const selection = select(diff, rows, options);
    if (selection.noOp) {
      output(
        { status: "already recorded; no write", form },
        options.format === "json",
      );
      return 0;
    }
    const writer = await import("./writer.ts");
    const { FORMS_ROOT } = await import("../harness/load.ts");
    const edit = await writer.preview(
      path.join(FORMS_ROOT, "parity/diffs"),
      diff,
      selection.finding.comparison,
      selection.finding.recordAs!,
      selection.entry,
    );
    await writer.commit(edit, Boolean(options["dry-run"]));
    output(
      {
        status: options["dry-run"]
          ? "preview; no authoritative file changed"
          : "recorded",
        form,
        file: edit.file,
        entry:
          options.format === "json" ? selection.entry : stable(selection.entry),
        before: digest(edit.before),
        after: digest(edit.after),
        edits:
          options.format === "json"
            ? edit.edits
            : edit.edits.map((e) => stable(e)),
      },
      options.format === "json",
    );
    return 0;
  } catch (error) {
    output(
      {
        error: (error as Error).message,
        help: "Run npm run --silent form -- findings <plan-slug> --format json; fetch/compile inputs explicitly if missing.",
      },
      options.format === "json",
    );
    return 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const args = process.argv.slice(2);
  if (args.length === 1 && ["--version", "-v", "-V"].includes(args[0]))
    console.log(VERSION);
  else process.exitCode = await main(args);
}
