import {
  rankWith,
  uiTypeIs,
  type JsonFormsRendererRegistryEntry,
  type UISchemaElement,
} from "@jsonforms/core";
import { RJSFSchema } from "@rjsf/utils";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { shapeFormData } from "src/utils/applyForm/applyFormUtils";

import { JsonFormsFields } from "src/components/apply-form/jsonforms/JsonFormsFields";

jest.mock("src/utils/applyForm/applyFormUtils", () => {
  const actual = jest.requireActual<
    typeof import("src/utils/applyForm/applyFormUtils")
  >("src/utils/applyForm/applyFormUtils");
  return { ...actual, shapeFormData: jest.fn(actual.shapeFormData) };
});

const schema: RJSFSchema = {
  type: "object",
  required: ["title"],
  properties: {
    title: { type: "string", title: "Project Title", maxLength: 60 },
    has_partner: { type: "string", title: "Has Partner", maxLength: 10 },
    partner_name: { type: "string", title: "Partner Name", maxLength: 60 },
  },
};

const uiSchema = {
  type: "Group",
  label: "The Form",
  elements: [
    {
      type: "Group",
      label: "Project Details",
      elements: [
        { type: "Control", scope: "#/properties/title" },
        { type: "Control", scope: "#/properties/has_partner" },
        {
          type: "Control",
          scope: "#/properties/partner_name",
          rule: {
            effect: "ENABLE",
            condition: {
              scope: "#/properties/has_partner",
              schema: { const: "yes" },
            },
          },
        },
      ],
    },
  ],
} as UISchemaElement;

const renderFields = (formData: object = {}) =>
  render(
    <form>
      <JsonFormsFields
        errors={null}
        formData={formData}
        schema={schema}
        uiSchema={uiSchema}
      />
    </form>,
  );

describe("JsonFormsFields", () => {
  it("renders each control with the widget and field name the SGG renderer would use", () => {
    renderFields({ title: "Saved title" });

    const title = screen.getByTestId("title");
    expect(title).toHaveAttribute("name", "title");
    expect(title).toHaveValue("Saved title");
    expect(title).toBeRequired();
  });

  it("wraps a labeled group in the section fieldset the nav links to", () => {
    renderFields();

    const section = screen.getByRole("group");
    expect(section).toHaveAttribute("id", "form-section-project-details");
    expect(within(section).getByText("Project Details")).toBeInTheDocument();
    expect(screen.queryByText("The Form")).not.toBeInTheDocument();
  });

  it("evaluates rules against the saved data", () => {
    renderFields({ has_partner: "yes" });

    expect(screen.getByTestId("partner_name")).toBeEnabled();
  });

  it("re-evaluates rules as the applicant types", () => {
    renderFields();
    expect(screen.getByTestId("partner_name")).toBeDisabled();

    const hasPartner = screen.getByTestId("has_partner");
    fireEvent.change(hasPartner, { target: { value: "yes" } });
    fireEvent.input(hasPartner, { target: { value: "yes" } });

    expect(screen.getByTestId("partner_name")).toBeEnabled();
  });

  it("rebuilds the rule data once per keystroke", () => {
    renderFields();
    jest.mocked(shapeFormData).mockClear();

    fireEvent.input(screen.getByTestId("has_partner"), {
      target: { value: "y" },
    });

    expect(shapeFormData).toHaveBeenCalledTimes(1);
  });

  it("uses the print widgets when printing", () => {
    render(
      <JsonFormsFields
        errors={null}
        formData={{ title: "Saved title" }}
        schema={schema}
        uiSchema={uiSchema}
        isFormLocked
        print
      />,
    );

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("Saved title")).toBeInTheDocument();
  });

  it("skips a control no widget can render", () => {
    const nestedListSchema: RJSFSchema = {
      type: "object",
      properties: {
        title: { type: "string", title: "Project Title" },
        budget: {
          type: "object",
          properties: {
            line_items: {
              type: "array",
              items: {
                type: "object",
                properties: { amount: { type: "string" } },
              },
            },
          },
        },
      },
    };
    render(
      <JsonFormsFields
        errors={null}
        formData={{}}
        schema={nestedListSchema}
        uiSchema={{
          type: "VerticalLayout",
          elements: [
            { type: "Control", scope: "#/properties/title" },
            {
              type: "Control",
              scope: "#/properties/budget/properties/line_items",
            },
          ],
        }}
      />,
    );

    expect(screen.getByTestId("title")).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.queryByText(/No applicable/)).not.toBeInTheDocument();
  });

  it("renders an element with an extra renderer ranked above the SGG ones", () => {
    const groups: JsonFormsRendererRegistryEntry[] = [
      {
        tester: rankWith(20, uiTypeIs("Group")),
        renderer: () => <p>Extra group</p>,
      },
    ];
    render(
      <form>
        <JsonFormsFields
          errors={null}
          formData={{}}
          schema={schema}
          uiSchema={uiSchema}
          extraRenderers={groups}
        />
      </form>,
    );

    expect(screen.getByText("Extra group")).toBeInTheDocument();
    expect(screen.queryByTestId("title")).not.toBeInTheDocument();
  });
});
