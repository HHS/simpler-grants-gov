import type { UISchemaElement } from "@jsonforms/core";
import { RJSFSchema } from "@rjsf/utils";

import { prepareJsonFormsUiSchema } from "src/components/apply-form/jsonforms/prepareUiSchema";

const mockLoggerWarn = jest.fn();

jest.mock("src/services/logger/simplerLogger", () => ({
  logger: {
    warn: (...args: unknown[]) => mockLoggerWarn(...args) as unknown,
  },
}));

const jsonSchema: RJSFSchema = {
  type: "object",
  properties: {
    title: { type: "string", title: "Title" },
    contacts: {
      type: "array",
      items: { type: "object", properties: { role: { type: "string" } } },
    },
  },
};

const uiSchema = {
  type: "Group",
  label: "Test",
  elements: [
    { type: "Control", scope: "#/properties/title" },
    { type: "Control", scope: "#/properties/missing" },
    {
      type: "Control",
      scope: "#/properties/contacts",
      options: {
        detail: {
          type: "VerticalLayout",
          elements: [
            {
              type: "Control",
              scope: "#/properties/role",
              rule: {
                effect: "ENABLE",
                condition: { scope: "#/properties/role", schema: {} },
              },
            },
          ],
        },
      },
    },
  ],
} as UISchemaElement;

const prepare = () =>
  prepareJsonFormsUiSchema({
    formId: "form1",
    formName: "Test",
    uiSchema,
    jsonSchema,
  });

describe("prepareJsonFormsUiSchema", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the section/field tree for the form", () => {
    expect(prepare().map((node) => node.type)).toEqual(["field", "fieldList"]);
  });

  it("warns about each control no widget can render, since it won't be shown", () => {
    prepare();

    expect(mockLoggerWarn).toHaveBeenCalledWith(
      { formId: "form1", formName: "Test", control: "#/properties/missing" },
      expect.stringContaining("won't be shown"),
    );
  });

  it("warns about each rule inside a list, since it won't be applied", () => {
    prepare();

    expect(mockLoggerWarn).toHaveBeenCalledWith(
      {
        formId: "form1",
        formName: "Test",
        control: "#/properties/contacts -> #/properties/role",
      },
      expect.stringContaining("won't be applied"),
    );
  });
});
