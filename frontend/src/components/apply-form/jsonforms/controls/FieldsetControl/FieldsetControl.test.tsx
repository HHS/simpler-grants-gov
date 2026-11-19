import type { UISchemaElement } from "@jsonforms/core";
import type { RJSFSchema } from "@rjsf/utils";
import { render, screen, within } from "@testing-library/react";

import { JsonFormsFields } from "src/components/apply-form/jsonforms/JsonFormsFields";

const schema: RJSFSchema = {
  type: "object",
  properties: { title: { type: "string", title: "Project Title" } },
};

const renderSections = (uiSchema: UISchemaElement) =>
  render(
    <JsonFormsFields
      errors={null}
      formData={{}}
      schema={schema}
      uiSchema={uiSchema}
    />,
  );

describe("FieldsetControl", () => {
  it("renders a labeled group as a section the form's navigation links to", () => {
    renderSections({
      type: "VerticalLayout",
      elements: [
        {
          type: "Group",
          label: "Project Details",
          elements: [{ type: "Control", scope: "#/properties/title" }],
        },
      ],
    });

    const section = screen.getByRole("group");
    expect(section).toHaveAttribute("id", "form-section-project-details");
    expect(
      within(section).getByRole("heading", {
        level: 4,
        name: "Project Details",
      }),
    ).toBeInTheDocument();
    expect(within(section).getByTestId("title")).toBeInTheDocument();
  });

  it("heads a section inside another section one level below it", () => {
    renderSections({
      type: "Group",
      label: "Project Details",
      elements: [
        {
          type: "Group",
          label: "Budget",
          elements: [{ type: "Group", label: "Line Items", elements: [] }],
        },
      ],
    });

    expect(
      screen.getByRole("heading", { level: 4, name: "Budget" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 5, name: "Line Items" }),
    ).toBeInTheDocument();
  });
});
