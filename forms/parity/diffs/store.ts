/** One data store, resolved into the unchanged evaluator contract. */
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  CATEGORIES,
  COMPARISONS,
  REGISTER_KINDS,
  type Comparison,
  type FormDiff,
  type Recorded,
  type Registers,
  type Value,
} from "../harness/model.ts";

export interface StoredEntry {
  reasonRef?: string;
  category?: Recorded["category"];
  reason?: string;
  plan?: Value;
  source?: Value;
  to?: string;
}
export type StoredForm = Partial<
  Record<
    Comparison,
    Partial<Record<keyof Registers, Record<string, StoredEntry>>>
  >
> & {
  slug: string;
  wording?: { labels?: StoredEntry; help?: StoredEntry };
  /** Source comments retained as author context, never acceptance policy. */
  notes?: string[];
};
export type Reasons = Record<string, Recorded>;

function object(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected an object in recorded-difference data.");
}
function keys(value: Record<string, unknown>, allowed: readonly string[]) {
  for (const key of Object.keys(value))
    if (!allowed.includes(key)) throw new Error(`Unknown record field ${key}.`);
}
function reason(value: unknown): Recorded {
  object(value);
  keys(value, ["category", "reason"]);
  if (
    typeof value.category !== "string" ||
    !Object.hasOwn(CATEGORIES, value.category) ||
    typeof value.reason !== "string" ||
    !value.reason.trim()
  )
    throw new Error(
      "A recorded reason needs a known category and a nonempty explanation.",
    );
  return value as unknown as Recorded;
}
const isValue = (v: unknown): v is Value =>
  v === null ||
  typeof v === "string" ||
  (typeof v === "number" && Number.isFinite(v)) ||
  (Array.isArray(v) && v.every((x) => typeof x === "string"));

export function resolve(data: unknown, reasons: Reasons): FormDiff {
  object(data);
  keys(data, ["slug", "wording", "notes", ...COMPARISONS]);
  if (typeof data.slug !== "string" || !data.slug)
    throw new Error("A record needs a plan slug.");
  if (
    data.notes !== undefined &&
    !(
      Array.isArray(data.notes) &&
      data.notes.every((n) => typeof n === "string")
    )
  )
    throw new Error("Record notes must be strings.");
  function entry(value: unknown, kind: "recorded" | "pinned" | "renamed") {
    object(value);
    const extra =
      kind === "pinned" ? ["plan", "source"] : kind === "renamed" ? ["to"] : [];
    keys(value, ["reasonRef", "category", "reason", ...extra]);
    let why: Recorded;
    if (value.reasonRef !== undefined) {
      if (
        typeof value.reasonRef !== "string" ||
        !Object.hasOwn(reasons, value.reasonRef) ||
        "category" in value ||
        "reason" in value
      )
        throw new Error(
          "A named reason must exist and cannot be overridden inline.",
        );
      why = reasons[value.reasonRef];
    } else why = reason({ category: value.category, reason: value.reason });
    if (kind === "pinned") {
      if (!isValue(value.plan) || !isValue(value.source))
        throw new Error("Pinned records need typed plan and source values.");
      return { ...why, plan: value.plan, source: value.source };
    }
    if (kind === "renamed") {
      if (typeof value.to !== "string" || !value.to)
        throw new Error("Renamed records need a target path.");
      return { ...why, to: value.to };
    }
    return { ...why };
  }
  const diff: FormDiff = { slug: data.slug };
  if (data.wording !== undefined) {
    object(data.wording);
    keys(data.wording, ["labels", "help"]);
    diff.wording = Object.fromEntries(
      Object.entries(data.wording).map(([key, value]) => [
        key,
        entry(value, "recorded"),
      ]),
    );
  }
  for (const comparison of COMPARISONS) {
    const registers = data[comparison];
    if (registers === undefined) continue;
    object(registers);
    keys(registers, Object.keys(REGISTER_KINDS));
    diff[comparison] = Object.fromEntries(
      Object.entries(registers).map(([register, entries]) => {
        object(entries);
        return [
          register,
          Object.fromEntries(
            Object.entries(entries).map(([key, value]) => [
              key,
              entry(value, REGISTER_KINDS[register as keyof Registers]),
            ]),
          ),
        ];
      }),
    );
  }
  return diff;
}

export function readReasons(input: unknown): Reasons {
  const document = input;
  object(document);
  keys(document, ["notes", "reasons"]);
  if (typeof document.notes !== "string")
    throw new Error("Shared reason context must be text.");
  const raw = document.reasons;
  object(raw);
  const reasons: Reasons = Object.fromEntries(
    Object.entries(raw).map(([name, value]) => [name, reason(value)]),
  );
  return reasons;
}

export function readRecord(file: string) {
  const reasonFile = path.join(path.dirname(file), "reasons.json");
  const before = readFileSync(file, "utf8"),
    reasonsBefore = readFileSync(reasonFile, "utf8");
  const reasons = readReasons(JSON.parse(reasonsBefore));
  const data: unknown = JSON.parse(before);
  const diff = resolve(data, reasons);
  return {
    file,
    before,
    reasonFile,
    reasonsBefore,
    reasons,
    data: data as StoredForm,
    diff,
  };
}
export type RecordFile = ReturnType<typeof readRecord>;

/** Reuse an existing name; accepting one finding never edits a shared definition. */
export function storeEntry(
  value: Recorded & { plan?: Value; source?: Value },
  reasons: Reasons,
  prior?: StoredEntry,
): StoredEntry {
  const same = (r: Recorded) =>
    r.category === value.category && r.reason === value.reason;
  const named =
    prior?.reasonRef &&
    reasons[prior.reasonRef] &&
    same(reasons[prior.reasonRef])
      ? prior.reasonRef
      : Object.keys(reasons).find((name) => same(reasons[name]));
  const { category, reason: text, ...pins } = value;
  return named
    ? { ...pins, reasonRef: named }
    : { ...pins, category, reason: text };
}
