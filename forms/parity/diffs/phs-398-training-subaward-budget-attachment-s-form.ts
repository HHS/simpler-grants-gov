import plan from "../../site/src/content/forms/phs-398-training-subaward-budget-attachment-s-form.json" with { type: "json" };
import {
  readConstraints,
  walkFields,
  type PlanField,
  type PlanNode,
} from "../harness/flatten/plan.ts";
import type { FormDiff, Pinned, Recorded } from "../harness/model.ts";

type Field = PlanField & { post_populated?: string; type: string };
const fields = walkFields(plan.children as PlanNode<Field>[]);

const uploadedPdf: Recorded = {
  category: "intentional",
  reason:
    "The applicant uploads a completed PDF. Grants.gov receives its budget name, budget data and separate justification. The upload ID has no XML element.",
};
const importedField: Recorded = {
  category: "intentional",
  reason:
    "This value comes from the uploaded budget. The parent form has no entry control for it.",
};

// XSD decimals have numeric bounds. The JSON schema checks the same ranges
// on decimal strings so the exported XML retains cents, including "0.00".
const patterns = new Map([
  [999999999999.99, "^[0-9]{1,12}(\\.[0-9]{1,2})?$"],
  [9999999999999.99, "^[0-9]{1,13}(\\.[0-9]{1,2})?$"],
  [999.99, "^[0-9]{1,3}(\\.[0-9]{1,2})?$"],
]);
const rangeReason =
  "The XML schema sets numeric limits. The JSON schema accepts decimal text within those limits so the submission preserves cents.";
const schemaRules: Record<string, Pinned> = {};
const xsdRules: Record<string, Pinned> = {};
const absentFromUi: Record<string, Recorded> = {};
const uploadReferences = Object.fromEntries(
  Array.from({ length: 30 }, (_, i) => [
    `attachments.slot${i + 1}`,
    uploadedPdf,
  ]),
);
for (const { field } of fields) {
  const path = field.json_path;
  if (!path || !field.post_populated || !field.xml_path) continue;
  if (
    !/^labels\.slot(?:[1-9]|[12]\d|30)$/.test(path) &&
    !path.startsWith("budgets[].")
  )
    continue;
  absentFromUi[path] = importedField;

  if (field.type !== "Decimal") continue;
  const maximum = readConstraints(field.constraints ?? "")?.maximum;
  if (typeof maximum !== "number") continue;
  const pattern = patterns.get(maximum);
  if (!pattern) continue;
  schemaRules[`${path}/pattern`] = {
    category: "intentional",
    reason: rangeReason,
    plan: null,
    source: pattern,
  };
  for (const [keyword, bound] of [
    ["minimum", 0],
    ["maximum", maximum],
  ] as const) {
    schemaRules[`${path}/${keyword}`] = {
      category: "intentional",
      reason: rangeReason,
      plan: bound,
      source: null,
    };
    xsdRules[`${path}/${keyword}`] = {
      category: "intentional",
      reason: rangeReason,
      plan: null,
      source: bound,
    };
  }
}

export const DIFF: FormDiff = {
  slug: plan.slug,
  xml: "xml-mapping",
  uiSchema: { absentFromSource: absentFromUi },
  jsonSchema: { differingRules: schemaRules },
  xmlMappingVsJsonSchema: { absentFromPlan: uploadReferences },
  jsonSchemaVsXsd: { differingRules: xsdRules },
};
