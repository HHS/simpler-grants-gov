import {
  KEYWORDS,
  type Discrepancy,
  type Fields,
  type FlatField,
  type Keyword,
  type Path,
  type Pinned,
  type Recorded,
  type Registers,
  type Value,
  type Wording,
} from "./model.ts";

/** A form plan beside one other artifact, and the differences already known between them. */
export interface Pair {
  registers: Registers;
  /** Label and help differences accepted wholesale. */
  wording?: Wording;
  plan: Fields;
  source: Fields;
}

/** Plan path -> source path. A declared rename beats an identity match. */
export function matchFields(pair: Pair): Map<Path, Path> {
  const renamed = pair.registers.renamed ?? {};
  const targets = new Set(Object.values(renamed).map((entry) => entry.to));
  const matched = new Map<Path, Path>();
  for (const path of pair.plan.keys()) {
    const target = renamed[path]?.to ?? (targets.has(path) ? undefined : path);
    if (target !== undefined && pair.source.has(target))
      matched.set(path, target);
  }
  return matched;
}

/** Fields on one side with no counterpart on the other. */
function unmatchedFields(pair: Pair): Discrepancy[] {
  const matched = matchFields(pair);
  const reached = new Set(matched.values());
  return [
    ...[...pair.plan.keys()]
      .filter((path) => !matched.has(path))
      .map((path) => ({
        kind: "missing from source",
        path,
        recordAs: { register: "absentFromSource" as const, key: path },
      })),
    ...[...pair.source.keys()]
      .filter((path) => !reached.has(path))
      .map((path) => ({
        kind: "missing from plan",
        path,
        recordAs: { register: "absentFromPlan" as const, key: path },
      })),
  ];
}

/** Indices of one longest strictly increasing subsequence of `values`. */
function longestIncreasing(values: readonly number[]): Set<number> {
  const length = values.map(() => 1);
  const previous = values.map(() => -1);
  for (let i = 0; i < values.length; i++) {
    for (let j = 0; j < i; j++) {
      if (values[j] < values[i] && length[j] + 1 > length[i]) {
        length[i] = length[j] + 1;
        previous[i] = j;
      }
    }
  }
  const kept = new Set<number>();
  let i = length.indexOf(Math.max(0, ...length));
  while (i !== -1) {
    kept.add(i);
    i = previous[i];
  }
  return kept;
}

/**
 * Matched fields whose relative order differs. Only the fewest fields that restore the order
 * are reported, so one misplaced field does not flag everything after it.
 */
function fieldOrder(pair: Pair): Discrepancy[] {
  const placed = [...matchFields(pair)]
    .map(([path, target]) => ({
      path,
      plan: pair.plan.get(path)!.order,
      source: pair.source.get(target)!.order,
    }))
    .filter(
      (f): f is { path: Path; plan: number; source: number } =>
        f.plan !== undefined && f.source !== undefined,
    )
    .sort((a, b) => a.plan - b.plan);
  const kept = longestIncreasing(placed.map((f) => f.source));
  return placed
    .filter((_, i) => !kept.has(i))
    .map((f) => ({
      kind: "out of order",
      path: f.path,
      detail: `plan position ${f.plan}, source position ${f.source}`,
      recordAs: { register: "outOfOrder" as const, key: f.path },
    }));
}

const normalize = (text: string | undefined) =>
  (text ?? "").replace(/\s+/g, " ").trim();

const TEXT = {
  label: { kind: "label differs", register: "differingLabels" },
  help: { kind: "help differs", register: "differingHelp" },
} as const;

/** Matched fields whose label or help text differs, ignoring whitespace. */
function textDifferences(
  pair: Pair,
  attribute: keyof typeof TEXT,
): Discrepancy[] {
  const { kind, register } = TEXT[attribute];
  const found: Discrepancy[] = [];
  for (const [path, target] of matchFields(pair)) {
    const plan = normalize(pair.plan.get(path)![attribute]);
    const source = normalize(pair.source.get(target)![attribute]);
    if (plan === source) continue;
    found.push({
      kind,
      path,
      detail: `plan "${plan}", source "${source}"`,
      recordAs: { register, key: path },
      values: { plan: plan || null, source: source || null },
    });
  }
  return found;
}

/**
 * `equal`: both sides state the same rule. `contains`: every answer the plan side accepts,
 * the source accepts too -- the plan side may be stricter.
 */
export type RuleMode = "equal" | "contains";

const UNBOUNDED = "unbounded";

const show = (value: unknown) =>
  value === undefined || value === null ? "none" : JSON.stringify(value);

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value) => b.includes(value));

function sameRule(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) return sameSet(a, b);
  return a === b;
}

/** True when the plan side accepts an answer the source rejects. */
function looser(keyword: Keyword, plan: unknown, source: unknown): boolean {
  if (source === undefined) return false;
  if (plan === undefined) return true;
  switch (keyword) {
    case "maxLength":
    case "maximum":
      return (plan as number) > (source as number);
    case "minLength":
    case "minimum":
      return (plan as number) < (source as number);
    case "enum":
      return (plan as string[]).some(
        (value) => !(source as string[]).includes(value),
      );
    case "maxOccurs":
      return (
        source !== UNBOUNDED &&
        (plan === UNBOUNDED || (plan as number) > (source as number))
      );
    default:
      return plan !== source;
  }
}

function requirednessDiffers(
  plan: FlatField,
  source: FlatField,
  mode: RuleMode,
): boolean {
  if (plan.required === undefined || source.required === undefined)
    return false;
  if (mode === "contains")
    return source.required === "yes" && plan.required !== "yes";
  const required = (field: FlatField) => field.required === "yes";
  return required(plan) !== required(source);
}

/** Matched fields whose listed rules differ, and their requiredness unless told otherwise. */
function ruleDifferences(
  pair: Pair,
  keywords: readonly Keyword[],
  mode: RuleMode,
  requiredness = true,
): Discrepancy[] {
  const found: Discrepancy[] = [];
  for (const [path, target] of matchFields(pair)) {
    const plan = pair.plan.get(path)!;
    const source = pair.source.get(target)!;
    if (requiredness && requirednessDiffers(plan, source, mode)) {
      found.push({
        kind: "requiredness differs",
        path,
        detail: `plan ${plan.required}, source ${source.required}`,
        recordAs: { register: "differingRules", key: `${path}/required` },
        values: {
          plan: plan.required ?? null,
          source: source.required ?? null,
        },
      });
    }
    for (const keyword of keywords) {
      const a = plan.rules[keyword];
      const b = source.rules[keyword];
      const differs =
        mode === "equal" ? !sameRule(a, b) : looser(keyword, a, b);
      if (!differs) continue;
      found.push({
        kind: `${keyword} differs`,
        path,
        detail: `plan ${show(a)}, source ${show(b)}`,
        recordAs: { register: "differingRules", key: `${path}/${keyword}` },
        values: { plan: a ?? null, source: b ?? null },
      });
    }
  }
  return found;
}

/** A difference a register accepts, with the entry that accepts it. */
export interface Accepted extends Discrepancy {
  entry: Recorded;
}

interface Settled {
  /** Differences a register records, at the values it records them. */
  accepted: Accepted[];
  /** Differences no register records. */
  unexpected: Discrepancy[];
  /** Register entries that no longer describe a real difference. */
  stale: Discrepancy[];
}

const sameValue = (a: Value, b: Value) =>
  Array.isArray(a) && Array.isArray(b)
    ? sameSet(a, b)
    : typeof a === "string" && typeof b === "string"
      ? normalize(a) === normalize(b)
      : a === b;

const isPinned = (entry: unknown): entry is Pinned =>
  typeof entry === "object" && entry !== null && "plan" in entry;

/**
 * Splits found differences into recorded and unexpected, and finds stale entries. A
 * difference whose values no longer match its pinned entry is unexpected again, reported
 * under its own kind with what was recorded.
 */
function settle(pair: Pair, found: readonly Discrepancy[]): Settled {
  const { registers } = pair;
  const wholesale = (d: Discrepancy) =>
    d.kind === TEXT.label.kind
      ? pair.wording?.labels
      : d.kind === TEXT.help.kind
        ? pair.wording?.help
        : undefined;
  const entryFor = (d: Discrepancy) =>
    (d.recordAs && registers[d.recordAs.register]?.[d.recordAs.key]) ??
    wholesale(d);
  const accepted: Accepted[] = [];
  const unexpected: Discrepancy[] = [];
  for (const d of found) {
    const entry = entryFor(d);
    if (entry === undefined) {
      unexpected.push(d);
    } else if (
      isPinned(entry) &&
      !(
        d.values &&
        sameValue(entry.plan, d.values.plan) &&
        sameValue(entry.source, d.values.source)
      )
    ) {
      unexpected.push({
        ...d,
        detail: `${d.detail}; recorded as plan ${show(entry.plan)}, source ${show(entry.source)}`,
      });
    } else {
      accepted.push({ ...d, entry });
    }
  }
  const entries = (
    Object.entries(registers) as [keyof Registers, Record<string, unknown>][]
  ).filter(([register]) => register !== "renamed");
  const stale: Discrepancy[] = entries.flatMap(([register, recorded]) =>
    Object.keys(recorded)
      .filter(
        (key) =>
          !found.some(
            (d) => d.recordAs?.register === register && d.recordAs.key === key,
          ),
      )
      .map((key) => ({
        kind: "stale entry",
        path: key,
        detail: `${register} records a difference that no longer exists`,
      })),
  );
  for (const attribute of ["label", "help"] as const) {
    const { kind } = TEXT[attribute];
    if (
      pair.wording?.[attribute === "label" ? "labels" : "help"] &&
      !found.some((d) => d.kind === kind)
    )
      stale.push({
        kind: "stale entry",
        path: attribute === "label" ? "wording.labels" : "wording.help",
        detail: `accepts ${attribute} differences, but there are none`,
      });
  }
  for (const [path, { to: target }] of Object.entries(
    registers.renamed ?? {},
  )) {
    const problem =
      path === target
        ? "renames a path to itself"
        : !pair.plan.has(path)
          ? "renames a path the plan does not have"
          : !pair.source.has(target)
            ? `renames to ${target}, which the source does not have`
            : undefined;
    if (problem) stale.push({ kind: "stale entry", path, detail: problem });
  }
  return { accepted, unexpected, stale };
}

/**
 * What one comparison checks. `subject` is the side the results describe: the plan, when
 * the other artifact is the requirement (DAT, XSD), or the other artifact, when it should
 * implement the plan (JSON schema, UI schema).
 */
export interface PairSpec {
  subject: "plan" | "source";
  /** False where only matched fields are compared, as when the pair is joined through the plan. */
  fields?: boolean;
  order?: boolean;
  labels?: boolean;
  help?: boolean;
  constraints?: { keywords: readonly Keyword[]; mode: RuleMode };
  /** How many times each field can appear, compared as `maxOccurs`. */
  occurrences?: RuleMode;
}

/** Every result of one comparison, after recorded differences are applied. */
export interface PairResult {
  /** Fields the other side has and the subject does not. */
  missingFields: Discrepancy[];
  /** Fields the subject has and the other side does not. */
  extraFields: Discrepancy[];
  fieldOrder: Discrepancy[];
  fieldLabels: Discrepancy[];
  fieldConstraints: Discrepancy[];
  fieldOccurrences: Discrepancy[];
  helpText: Discrepancy[];
  /** Differences the form's record accepts. */
  recorded: Accepted[];
  /** Recorded differences that no longer exist. */
  stale: Discrepancy[];
}

const OCCURRENCES_KIND = "maxOccurs differs";

const CONSTRAINT_KINDS = new Set([
  "requiredness differs",
  ...KEYWORDS.map((keyword) => `${keyword} differs`).filter(
    (kind) => kind !== OCCURRENCES_KIND,
  ),
]);

/** Runs the checks `spec` names on `pair`; a check it does not name has no results. */
export function comparePair(pair: Pair, spec: PairSpec): PairResult {
  const found = [
    ...(spec.fields === false ? [] : unmatchedFields(pair)),
    ...(spec.order ? fieldOrder(pair) : []),
    ...(spec.labels ? textDifferences(pair, "label") : []),
    ...(spec.help ? textDifferences(pair, "help") : []),
    ...(spec.constraints
      ? ruleDifferences(pair, spec.constraints.keywords, spec.constraints.mode)
      : []),
    ...(spec.occurrences
      ? ruleDifferences(pair, ["maxOccurs"], spec.occurrences, false)
      : []),
  ];
  const { accepted, unexpected, stale } = settle(pair, found);
  const ofKind = (kind: string) => unexpected.filter((d) => d.kind === kind);
  const [lacking, adding] =
    spec.subject === "plan"
      ? ["missing from plan", "missing from source"]
      : ["missing from source", "missing from plan"];
  return {
    missingFields: ofKind(lacking),
    extraFields: ofKind(adding),
    fieldOrder: ofKind("out of order"),
    fieldLabels: ofKind("label differs"),
    fieldConstraints: unexpected.filter((d) => CONSTRAINT_KINDS.has(d.kind)),
    fieldOccurrences: ofKind(OCCURRENCES_KIND),
    helpText: ofKind("help differs"),
    recorded: accepted,
    stale,
  };
}
