/** Public build-time contract shared by parity consumers. */
import type { Plan, PlanField } from "./harness/flatten/plan.ts";
import type {
  Category,
  Discrepancy,
  FlatField,
  Recorded,
} from "./harness/model.ts";

export const SOURCES = ["dat", "xsd", "form"] as const;
export type Source = (typeof SOURCES)[number];
export const ATTRIBUTES = [
  "matchedBy",
  "label",
  "help",
  "required",
  "length",
  "format",
  "range",
  "options",
  "position",
  "xmlMapping",
] as const;
export type Attribute = (typeof ATTRIBUTES)[number];
export type Status = "match" | Category | "notCompared" | "unrecorded";
export type CheckName =
  | "dat"
  | "xsd"
  | "jsonSchema"
  | "uiSchema"
  | "jsonSchemaVsXsd"
  | "xmlMapping"
  | "xmlMappingVsJsonSchema"
  | "xmlMappingVsXsd";
export type Artifact =
  | "plan"
  | "dat"
  | "xsd"
  | "jsonSchema"
  | "uiSchema"
  | "xmlMapping"
  | "differenceRecord"
  | "index";
/** Paths retain their artifact/check syntax; they are not universal JSON pointers. */
export interface Anchor {
  artifact: Artifact;
  path: string;
}
export interface Finding extends Discrepancy {
  /** Evaluation-local identity, not a durable comment or question identifier. */
  id: string;
  check: CheckName | "plan" | "index";
  checkTitle: string;
  status: Category | "unrecorded" | "stale";
  dimension: string;
  anchors: Anchor[];
  entry?: Recorded;
}
/** Neighbor labels, falling back to paths when no plan label exists. */
export interface Position {
  before?: string;
  after?: string;
}
export interface FieldSource extends Omit<FlatField, "order"> {
  /** Expected plan address and the actual matched artifact address, respectively. */
  key?: string;
  path?: string;
  position?: Position;
  planPosition?: Position;
}
export interface Outcome {
  status: Status;
  reason?: string;
  /** Original finding objects contributing to this outcome. */
  findings: Finding[];
  options?: { missing: string[]; extra: string[] };
}
export interface FieldResult<F extends PlanField = PlanField> {
  /** Existing json_path, else the field's tree position; local to this plan. */
  id: string;
  field: F;
  plan: FlatField;
  sources: Record<Source, FieldSource>;
  writtenPaths: string[];
  outcomes: Record<Attribute, Record<Source, Outcome>>;
  /** Includes dimensions omitted from table rows, such as maxOccurs. */
  findings: Finding[];
}
/** Fields are in depth-first plan order. Source-only/stale evidence stays in the full ledger. */
export interface FormResult<F extends PlanField = PlanField> {
  plan: Plan<F>;
  fields: FieldResult<F>[];
  findings: Finding[];
}
export type {
  Plan,
  PlanField,
  PlanNode,
  PlanSection,
} from "./harness/flatten/plan.ts";
export type { Category, FlatField } from "./harness/model.ts";
