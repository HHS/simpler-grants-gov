import type { RJSFSchema } from "@rjsf/utils";
import type { ErrorObject } from "ajv";
import { expect, it } from "vitest";

import { createAjv, toValidationWarnings } from "../../../lib/validation";
import { requiredChoiceWarnings } from "./requiredChoiceWarnings";

const schema: RJSFSchema = {
  type: "object",
  properties: {
    application_id: { type: "string", minLength: 1, title: "Application ID" },
    project_reference: {
      type: "string",
      minLength: 1,
      title: "Project reference",
    },
    title: { type: "string", title: "Title" },
  },
  required: ["title"],
  allOf: [
    {
      anyOf: [
        { required: ["application_id"] },
        { required: ["project_reference"] },
      ],
    },
  ],
};
const errorsFor = (contract: RJSFSchema, data: unknown): ErrorObject[] => {
  const validate = createAjv().compile(contract);
  validate(data);
  return validate.errors ?? [];
};
const preview = (contract: RJSFSchema, data: unknown) =>
  requiredChoiceWarnings(errorsFor(contract, data), contract);
const message = "Provide at least one: Application ID or Project reference.";

it("presents a pure root sibling choice once and preserves raw evidence structurally", () => {
  const errors = errorsFor(schema, { title: "Director" });
  const before = structuredClone(errors);
  const raw = toValidationWarnings(errors);
  expect(raw).toHaveLength(3);
  expect(requiredChoiceWarnings(errors, schema)).toEqual([
    { field: "$.application_id", type: "anyOf", value: null, message },
  ]);
  expect(errors).toEqual(before);
  expect(toValidationWarnings(errors)).toEqual(raw);
});

it.each([
  { title: "Director", application_id: "A1" },
  { title: "Director", project_reference: "P1" },
  { title: "Director", application_id: "A1", project_reference: "P1" },
])(
  "does not invent errors or values when a choice is satisfied: %j",
  (data) => {
    const before = structuredClone(data);
    expect(preview(schema, data)).toEqual([]);
    expect(data).toEqual(before);
  },
);

it("retains supplied-empty validation even for a participating field", () => {
  const result = preview(schema, {
    title: "Director",
    application_id: "A1",
    project_reference: "",
  });
  expect(result).toEqual([
    expect.objectContaining({
      field: "$.project_reference",
      type: "minLength",
    }),
  ]);
});

it("keeps unrelated required errors beside the choice", () => {
  expect(preview(schema, {})).toEqual([
    expect.objectContaining({ field: "$.title", type: "required" }),
    expect.objectContaining({ field: "$.application_id", message }),
  ]);
});

it("preserves an unconditional required error on the same choice member", () => {
  const contract = { ...schema, required: ["title", "application_id"] };
  expect(preview(contract, { title: "Director" })).toEqual([
    expect.objectContaining({ field: "$.application_id", type: "required" }),
    expect.objectContaining({
      field: "$.application_id",
      type: "anyOf",
      message,
    }),
  ]);
});

it("handles a differently named three-member relation without XOR language", () => {
  const contract: RJSFSchema = {
    type: "object",
    properties: {
      fax: { type: "string" },
      phone: { type: "string" },
      email: { type: "string" },
    },
    anyOf: ["fax", "phone", "email"].map((name) => ({ required: [name] })),
  };
  expect(preview(contract, {})).toEqual([
    expect.objectContaining({
      field: "$.fax",
      message: "Provide at least one: fax or phone or email.",
    }),
  ]);
});

const unrecognized: [string, RJSFSchema, unknown][] = [
  [
    "nested choice",
    { type: "object", properties: { entry: schema } },
    { entry: { title: "Director" } },
  ],
  [
    "compound required branch",
    {
      ...schema,
      allOf: [
        {
          anyOf: [
            { required: ["application_id", "title"] },
            { required: ["project_reference"] },
          ],
        },
      ],
    },
    {},
  ],
  [
    "type-union anyOf",
    { anyOf: [{ type: "string" }, { type: "number" }] },
    true,
  ],
  [
    "oneOf",
    {
      type: "object",
      oneOf: [
        { required: ["application_id"] },
        { required: ["project_reference"] },
      ],
    },
    {},
  ],
  [
    "unknown member",
    {
      type: "object",
      properties: {},
      anyOf: [{ required: ["a"] }, { required: ["b"] }],
    },
    {},
  ],
  [
    "complex member",
    {
      type: "object",
      properties: { a: { type: "object" }, b: { type: "string" } },
      anyOf: [{ required: ["a"] }, { required: ["b"] }],
    },
    {},
  ],
  [
    "duplicate member",
    {
      type: "object",
      properties: { a: { type: "string" } },
      anyOf: [{ required: ["a"] }, { required: ["a"] }],
    },
    {},
  ],
  [
    "branch with additional assertion",
    {
      ...schema,
      allOf: [
        {
          anyOf: [
            { required: ["application_id"], minProperties: 2 },
            { required: ["project_reference"] },
          ],
        },
      ],
    },
    { title: "Director" },
  ],
];
it.each(unrecognized)(
  "leaves unsupported %s in the unchanged raw fallback",
  (_name, contract, data) => {
    const errors = errorsFor(contract, data);
    expect(errors.length).toBeGreaterThan(0);
    expect(requiredChoiceWarnings(errors, contract)).toEqual(
      toValidationWarnings(errors),
    );
  },
);

it("requires exact schema-path and instance provenance before suppressing branch errors", () => {
  const errors = errorsFor(schema, { title: "Director" });
  const unrelated = errors.map((error, index) =>
    index === 0
      ? { ...error, schemaPath: "#/allOf/99/anyOf/0/required" }
      : error,
  );
  expect(requiredChoiceWarnings(unrelated, schema)).toEqual(
    toValidationWarnings(unrelated),
  );
});

it("does not promise whole-contract validity when another rule forbids supplying both", () => {
  const contract: RJSFSchema = {
    ...schema,
    not: { required: ["application_id", "project_reference"] },
  };
  expect(preview(contract, { title: "Director" })).toEqual([
    expect.objectContaining({
      message: "Provide at least one: Application ID or Project reference.",
    }),
  ]);
  const both = {
    title: "Director",
    application_id: "A1",
    project_reference: "P1",
  };
  const errors = errorsFor(contract, both);
  expect(errors).toContainEqual(expect.objectContaining({ keyword: "not" }));
  expect(requiredChoiceWarnings(errors, contract)).toEqual(
    toValidationWarnings(errors),
  );
});
