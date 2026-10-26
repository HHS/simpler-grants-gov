import { processFormSchema } from "@sgg/frontend/utils/applyForm/applyFormUtils";
import type { ValidateFunction } from "ajv";
import { beforeAll, expect, it } from "vitest";

import { jsonSchemaFields } from "../../../parity/harness/flatten/jsonSchema";
import { loadXmlTransform } from "../../../parity/harness/load";
import { loadFormSpec, type FormSpec } from "./formSpec";
import { createAjv } from "./validation";

const id = "epa-form-4700-4";
let spec: FormSpec;
let validate: ValidateFunction;
beforeAll(async () => {
  spec = await loadFormSpec(id);
  validate = createAjv().compile(spec.schema);
});
type Answers = Record<string, unknown>;
const examples = () =>
  (spec.schema as typeof spec.schema & { examples: Answers[] }).examples;
const completedExample = () =>
  examples().find((data) =>
    Object.hasOwn(data.applicant_signature as Answers, "aor_signature"),
  )!;
const draftExample = () =>
  examples().find(
    (data) =>
      !Object.hasOwn(data.applicant_signature as Answers, "aor_signature"),
  )!;
const answer = () => structuredClone(completedExample());
const changed = (path: string, value: unknown, remove = false) => {
  const data = answer();
  const parts = path.split(".");
  let target = data;
  for (const part of parts.slice(0, -1)) target = target[part] as Answers;
  if (remove) delete target[parts.at(-1)!];
  else target[parts.at(-1)!] = value;
  return data;
};

it("retains the original 28 installed answer paths without generic contact/address additions", () => {
  expect([...jsonSchemaFields(spec.schema).keys()].sort()).toEqual(
    [
      "applicant_name",
      "applicant_address.address",
      "applicant_address.city",
      "applicant_address.state",
      "applicant_address.zip_code",
      "sam_uei",
      "point_of_contact_name",
      "point_of_contact_phone_number",
      "point_of_contact_email",
      "point_of_contact_title",
      "federal_financial_assistance",
      "civil_rights_lawsuit_question1",
      "civil_rights_lawsuit_question2",
      "civil_rights_lawsuit_question3",
      "construction_federal_assistance",
      "construction_new_facilities",
      "construction_new_facilities_explanation",
      "notice1",
      "notice2",
      "notice3",
      "notice4",
      "demographic_data",
      "policy",
      "policy_explanation",
      "program_explanation",
      "applicant_signature.aor_signature",
      "applicant_signature.aor_title",
      "applicant_signature.submitted_date",
    ].sort(),
  );
  expect(loadXmlTransform(id)).toBeUndefined();
});

it("validates the explicit-context draft and distinct completed examples without claiming signing", () => {
  expect(examples()).toHaveLength(2);
  for (const data of examples())
    expect(validate(data), JSON.stringify(validate.errors)).toBe(true);
  const draft = draftExample();
  expect(draft.applicant_signature).not.toHaveProperty("aor_signature");
  expect(draft.applicant_signature).not.toHaveProperty("submitted_date");
  expect(answer().point_of_contact_title).not.toBe(
    (answer().applicant_signature as Answers).aor_title,
  );
});

const booleans = [
  "federal_financial_assistance",
  "construction_federal_assistance",
  "construction_new_facilities",
  "notice1",
  "notice2",
  "notice3",
  "notice4",
  "demographic_data",
  "policy",
];
it.each(booleans)(
  "%s preserves true/false/absent and rejects source-coded strings as API answers",
  (field) => {
    for (const value of [true, false])
      expect(validate(changed(field, value))).toBe(true);
    expect(validate(changed(field, undefined, true))).toBe(true);
    for (const value of ["Y: Yes", "N: No", "NA", null])
      expect(validate(changed(field, value))).toBe(false);
  },
);

it.each([
  ["applicant_address.address", "x".repeat(56), true],
  ["applicant_address.address", "x".repeat(110), true],
  ["applicant_address.address", "x".repeat(111), false],
  ["point_of_contact_name", "x".repeat(100), true],
  ["point_of_contact_name", "x".repeat(101), false],
  ["civil_rights_lawsuit_question1", "x".repeat(4000), true],
  ["civil_rights_lawsuit_question2", "x".repeat(4001), false],
  ["civil_rights_lawsuit_question3", "", false],
  ["construction_new_facilities_explanation", "x".repeat(500), true],
  ["construction_new_facilities_explanation", "x".repeat(501), false],
  ["policy_explanation", "x".repeat(1001), false],
  ["program_explanation", "NA", true],
  ["point_of_contact_email", "not-an-email", false],
  ["point_of_contact_email", "", false],
] as const)(
  "%s has its source-specific bound/content contract",
  (path, value, valid) => {
    expect(
      validate(changed(path, value)),
      JSON.stringify(validate.errors),
    ).toBe(valid);
  },
);

it.each([
  "applicant_address.address",
  "applicant_address.city",
  "applicant_address.state",
  "applicant_address.zip_code",
  "point_of_contact_title",
  "applicant_signature.aor_title",
])("%s is a separate required answer", (path) => {
  expect(validate(changed(path, undefined, true))).toBe(false);
});

it("marks only actual context fields readonly and uses 9 explicit native Radio controls", () => {
  const { formSchema } = processFormSchema(spec.schema);
  type ReadonlyProperty = { readOnly?: boolean };
  const properties = formSchema.properties as
    | Record<
        string,
        ReadonlyProperty & {
          properties?: Record<string, ReadonlyProperty>;
        }
      >
    | undefined;
  if (!properties) throw new Error("Processed EPA schema must have properties");
  expect(properties.sam_uei.readOnly).toBe(true);
  expect(properties.point_of_contact_title.readOnly).not.toBe(true);
  const signature = properties.applicant_signature.properties;
  if (!signature) throw new Error("Applicant signature must remain an object");
  expect(signature.aor_signature.readOnly).toBe(true);
  expect(signature.submitted_date.readOnly).toBe(true);
  expect(signature.aor_title.readOnly).not.toBe(true);
  const radios: string[] = [];
  type UiNode = {
    type: string;
    scope?: string;
    options?: { widget?: string };
    elements?: UiNode[];
  };
  const visit = (node: UiNode) => {
    if (node.type === "Control" && node.options?.widget === "Radio")
      radios.push(node.scope!);
    for (const child of node.elements ?? []) visit(child);
  };
  visit(spec.uischema as UiNode);
  expect(radios.sort()).toEqual(
    booleans.map((field) => `#/properties/${field}`).sort(),
  );
});
