/** Completed build-time evidence. Views project these records; they do not rerun checks. */
import type { PairResult } from "./harness/compare.ts";
import type { Plan } from "./harness/flatten/plan.ts";
import type { SPECS } from "./harness/index.ts";
import type {
  Category,
  Discrepancy,
  Fields,
  Recorded,
  Renamed,
} from "./harness/model.ts";

export type CheckName = keyof typeof SPECS;
export type Artifact =
  | "plan"
  | "dat"
  | "xsd"
  | "jsonSchema"
  | "uiSchema"
  | "xmlMapping"
  | "differenceRecord"
  | "index";
/** Paths retain their originating check's syntax; these are not universal JSON pointers. */
export interface Anchor {
  artifact: Artifact;
  path: string;
}

export interface Finding extends Discrepancy {
  /** Unique within this evaluation, not a cross-release comment or question identity. */
  id: string;
  check: CheckName | "plan" | "index";
  checkTitle: string;
  status: Category | "unrecorded" | "stale";
  dimension: string;
  anchors: Anchor[];
  entry?: Recorded;
}

export interface CompletedCheck {
  name: CheckName;
  title: string;
  /** `plan` and `source` retain the existing comparison orientation, named by these artifacts. */
  artifacts: { plan: Artifact; source: Artifact };
  plan: Fields;
  source: Fields;
  matched: Map<string, string>;
  renames: Record<string, Renamed>;
  coverage: Set<string>;
  result: PairResult;
  findings: Finding[];
}

/** Internal Maps stay at build time. Only field rows and diagnostics are serialized for views. */
export interface FormEvaluation {
  plan: Plan;
  checks: Partial<Record<CheckName, CompletedCheck>>;
  findings: Finding[];
  suite: { planProblems: Discrepancy[]; indexProblems: Discrepancy[] };
}

export { evaluateForm } from "./harness/index.ts";
export { readRequired, walkFields } from "./harness/flatten/plan.ts";
export type {
  Plan,
  PlanField,
  PlanNode,
  PlanSection,
} from "./harness/flatten/plan.ts";
export type { Category, FlatField } from "./harness/model.ts";
