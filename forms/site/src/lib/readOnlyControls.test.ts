import type { ControlElement } from "@jsonforms/core";
import type { RJSFSchema } from "@rjsf/utils";
import { processFormSchema } from "@sgg/frontend/utils/applyForm/applyFormUtils";
import { getFieldConfig } from "@sgg/frontend/utils/applyForm/getFieldConfig";
import { describe, expect, it } from "vitest";

import { controlToNodes } from "../vendor/sgg/jsonFormsUiSchema";
import { loadFormSpec } from "./formSpec";

const control = (scope: string, readonly = false): ControlElement => ({
  type: "Control",
  scope,
  options: { readonly },
});
const disabled = (schema: RJSFSchema, scope: string, readonly = false) =>
  controlToNodes(control(scope, readonly), schema).map(
    (node) =>
      getFieldConfig({
        uiFieldObject: node,
        formSchema: schema,
        formData: {},
        errors: null,
        requiredField: false,
      }).props.disabled,
  );

describe("context-owned objects through the native SGG widget adapter", () => {
  const schema: RJSFSchema = {
    type: "object",
    properties: {
      owned: {
        type: "object",
        readOnly: true,
        properties: {
          first: { type: "string" },
          nested: {
            type: "object",
            properties: { last: { type: "string", readOnly: false } },
          },
        },
      },
      editable: { type: "string" },
      scalar: { type: "string", readOnly: true },
    },
  };
  it("disables every leaf of an object-scoped control", () => {
    expect(disabled(schema, "#/properties/owned")).toEqual([true, true]);
  });
  it("honors an ancestor for separately laid out nested leaves without sibling spill", () => {
    expect(
      disabled(schema, "#/properties/owned/properties/nested/properties/last"),
    ).toEqual([true]);
    expect(disabled(schema, "#/properties/editable")).toEqual([false]);
  });
  it("does not treat a property named readOnly as an annotation on the properties map", () => {
    const booleanProperty: RJSFSchema = {
      type: "object",
      properties: { readOnly: true, editable: { type: "string" } },
    };
    expect(disabled(booleanProperty, "#/properties/editable")).toEqual([false]);
  });

  it("retains scalar and explicit control readonly behavior", () => {
    expect(disabled(schema, "#/properties/scalar")).toEqual([true]);
    expect(disabled(schema, "#/properties/editable", true)).toEqual([true]);
  });
  it("keeps all five actual AD1047 name controls disabled and project editable", async () => {
    const spec = await loadFormSpec("usda-ad-1047");
    const { formSchema } = processFormSchema(spec.schema);
    const actual = formSchema as RJSFSchema;
    const scopes = [
      "prefix",
      "first_name",
      "middle_name",
      "last_name",
      "suffix",
    ].map((key) => `#/properties/authorized_representative/properties/${key}`);
    expect(scopes.flatMap((scope) => disabled(actual, scope))).toEqual([
      true,
      true,
      true,
      true,
      true,
    ]);
    expect(disabled(actual, "#/properties/project_name")).toEqual([false]);
  });
  it("leaves Individual applicant name and title editable", async () => {
    const spec = await loadFormSpec(
      "assurances-for-non-construction-programs-sf-424b-individual",
    );
    const { formSchema } = processFormSchema(spec.schema);
    const actual = formSchema as RJSFSchema;
    expect(
      disabled(actual, "#/properties/applicant_organization_name"),
    ).toEqual([false]);
    expect(
      disabled(
        actual,
        "#/properties/authorized_representative/properties/title",
      ),
    ).toEqual([false]);
  });
});
