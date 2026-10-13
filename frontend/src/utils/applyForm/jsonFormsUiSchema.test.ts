import {
  RuleEffect,
  type ControlElement,
  type UISchemaElement,
} from "@jsonforms/core";
import { RJSFSchema } from "@rjsf/utils";
import {
  controlToNodes,
  groupName,
  jsonFormsToUiSchema,
  unadaptableScopes,
  unappliedListRules,
} from "src/utils/applyForm/jsonFormsUiSchema";
import { validateUiSchema } from "src/utils/applyForm/validateUiSchema";

const schema: RJSFSchema = {
  type: "object",
  properties: {
    title: { type: "string", title: "Title" },
    address: {
      type: "object",
      properties: {
        street1: { type: "string" },
        city: { type: "string" },
      },
    },
    contacts: {
      type: "array",
      title: "Contacts",
      items: {
        type: "object",
        properties: {
          role: { type: "string" },
          name: {
            type: "object",
            properties: { first: { type: "string" }, last: { type: "string" } },
          },
        },
      },
    },
    nested: {
      type: "object",
      properties: {
        people: {
          type: "array",
          items: { type: "object", properties: { id: { type: "string" } } },
        },
      },
    },
  },
};

const control = (
  scope: string,
  extra: Partial<ControlElement> = {},
): ControlElement => ({ type: "Control", scope, ...extra });

describe("controlToNodes", () => {
  it("maps a control on a scalar to one field", () => {
    expect(controlToNodes(control("#/properties/title"), schema)).toEqual([
      { type: "field", definition: "/properties/title" },
    ]);
  });

  it("carries the widget a control names through to the field", () => {
    expect(
      controlToNodes(
        control("#/properties/title", { options: { widget: "Attachment" } }),
        schema,
      ),
    ).toEqual([
      { type: "field", definition: "/properties/title", widget: "Attachment" },
    ]);
  });

  it("maps a readonly control to a disabled field", () => {
    expect(
      controlToNodes(
        control("#/properties/title", { options: { readonly: true } }),
        schema,
      ),
    ).toEqual([{ type: "null", definition: "/properties/title" }]);
  });

  it("expands a control on an object into its leaves", () => {
    expect(controlToNodes(control("#/properties/address"), schema)).toEqual([
      { type: "field", definition: "/properties/address/properties/street1" },
      { type: "field", definition: "/properties/address/properties/city" },
    ]);
  });

  it("maps a top-level array of objects to a field list over the item's leaves", () => {
    expect(controlToNodes(control("#/properties/contacts"), schema)).toEqual([
      {
        type: "fieldList",
        name: "contacts",
        label: "Contacts",
        description: undefined,
        children: [
          {
            type: "field",
            definition: "/properties/contacts/items/properties/role",
          },
          {
            type: "field",
            definition:
              "/properties/contacts/items/properties/name/properties/first",
          },
          {
            type: "field",
            definition:
              "/properties/contacts/items/properties/name/properties/last",
          },
        ],
      },
    ]);
  });

  it("returns nothing for a control no widget can draw", () => {
    expect(
      controlToNodes(control("#/properties/nested/properties/people"), schema),
    ).toEqual([]);
    expect(controlToNodes(control("#/properties/absent"), schema)).toEqual([]);
    expect(controlToNodes(control("#"), schema)).toEqual([]);
  });
});

describe("a list control with options.detail", () => {
  const listSchema: RJSFSchema = {
    type: "object",
    properties: {
      contacts: {
        type: "array",
        title: "Contacts",
        items: {
          type: "object",
          properties: {
            role: { type: "string" },
            name: {
              type: "object",
              properties: {
                first: { type: "string" },
                last: { type: "string" },
              },
            },
            phones: {
              type: "array",
              items: {
                type: "object",
                properties: { number: { type: "string" } },
              },
            },
          },
        },
      },
    },
  };

  const list = (elements: UISchemaElement[]) =>
    control("#/properties/contacts", {
      options: { detail: { type: "Group", elements } },
    });

  const childDefinitions = (listControl: ControlElement) => {
    const [node] = controlToNodes(listControl, listSchema);
    return node.type === "fieldList"
      ? node.children.map((child) => [child.type, child.definition])
      : [];
  };

  it("orders the entry's fields by the detail rather than the item schema", () => {
    expect(
      childDefinitions(
        list([
          control("#/properties/name/properties/last"),
          control("#/properties/role", { options: { readonly: true } }),
          control("#/properties/name/properties/first"),
        ]),
      ),
    ).toEqual([
      ["field", "/properties/contacts/items/properties/name/properties/last"],
      ["null", "/properties/contacts/items/properties/role"],
      ["field", "/properties/contacts/items/properties/name/properties/first"],
    ]);
  });

  it("reads nested groups in the detail and expands a control on an object", () => {
    expect(
      childDefinitions(
        list([
          {
            type: "Group",
            label: "Name",
            elements: [control("#/properties/name")],
          },
          control("#/properties/role"),
        ]),
      ),
    ).toEqual([
      ["field", "/properties/contacts/items/properties/name/properties/first"],
      ["field", "/properties/contacts/items/properties/name/properties/last"],
      ["field", "/properties/contacts/items/properties/role"],
    ]);
  });

  it("leaves out a list nested in the entry, and reports it", () => {
    const listControl = list([
      control("#/properties/role"),
      control("#/properties/phones"),
    ]);

    expect(childDefinitions(listControl)).toEqual([
      ["field", "/properties/contacts/items/properties/role"],
    ]);
    expect(unadaptableScopes(listControl, listSchema)).toEqual([
      "#/properties/contacts -> #/properties/phones",
    ]);
  });

  it("reports the rules on the entry's fields, which the field list does not apply", () => {
    const uiSchema = {
      type: "Group",
      elements: [
        list([
          control("#/properties/role", {
            rule: {
              effect: RuleEffect.ENABLE,
              condition: { scope: "#/properties/name", schema: {} },
            },
          }),
        ]),
      ],
    } as UISchemaElement;

    expect(unappliedListRules(uiSchema)).toEqual([
      "#/properties/contacts -> #/properties/role",
    ]);
  });
});

describe("jsonFormsToUiSchema", () => {
  const uiSchema: UISchemaElement = {
    type: "Group",
    label: "The Form Itself",
    elements: [
      control("#/properties/title"),
      {
        type: "Group",
        label: "Where & Who",
        elements: [
          control("#/properties/address"),
          control("#/properties/contacts"),
        ],
      },
      {
        type: "VerticalLayout",
        elements: [control("#/properties/title")],
      },
    ],
  };

  it("drops the root layout, turns labeled groups into sections and flattens the rest", () => {
    const tree = jsonFormsToUiSchema(uiSchema, schema);

    expect(tree.map((node) => node.type)).toEqual([
      "field",
      "section",
      "field",
    ]);
    expect(tree[1]).toMatchObject({
      type: "section",
      name: "where-who",
      label: "Where & Who",
    });
  });

  it("produces a tree the UI schema validator accepts", () => {
    expect(validateUiSchema(jsonFormsToUiSchema(uiSchema, schema))).toBeFalsy();
  });
});

describe("unadaptableScopes", () => {
  it("lists every control no widget can draw", () => {
    const uiSchema = {
      type: "Group",
      elements: [
        control("#/properties/title"),
        control("#/properties/nested/properties/people"),
      ],
    } as UISchemaElement;

    expect(unadaptableScopes(uiSchema, schema)).toEqual([
      "#/properties/nested/properties/people",
    ]);
  });
});

describe("groupName", () => {
  it("slugs a label into a stable section name", () => {
    expect(groupName("Section A: Budget Summary")).toEqual(
      "section-a-budget-summary",
    );
  });
});
