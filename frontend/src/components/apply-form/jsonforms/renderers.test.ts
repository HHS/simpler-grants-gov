import { NOT_APPLICABLE, type JsonSchema } from "@jsonforms/core";

import { adaptedControlTester } from "src/components/apply-form/jsonforms/renderers";

const entryControl = { type: "Control", scope: "#" };
const rank = (schema: JsonSchema) =>
  adaptedControlTester(entryControl, schema, {
    rootSchema: schema,
    config: {},
  });

describe("adaptedControlTester", () => {
  it.each<[string, JsonSchema]>([
    ["string", { type: "string" }],
    ["number", { type: "number" }],
    ["boolean", { type: "boolean" }],
  ])("matches a control on a list entry's own value (%s)", (_, schema) => {
    expect(rank(schema)).toBeGreaterThan(NOT_APPLICABLE);
  });

  it.each<[string, JsonSchema]>([
    [
      "the whole form",
      { type: "object", properties: { a: { type: "string" } } },
    ],
    ["a list", { type: "array", items: { type: "string" } }],
  ])("skips a control scoped to # on an object or list (%s)", (_, schema) => {
    expect(rank(schema)).toBe(NOT_APPLICABLE);
  });
});
