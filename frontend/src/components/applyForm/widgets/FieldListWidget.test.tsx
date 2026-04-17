import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import FieldListWidget from "src/components/applyForm/widgets/FieldListWidget";

jest.mock("src/components/applyForm/widgets/WidgetRenderers", () => ({
  renderWidget: jest.fn(
    ({ props }: { props: { id: string; value?: unknown } }) => {
      const displayValue =
        typeof props.value === "string" ||
        typeof props.value === "number" ||
        typeof props.value === "boolean"
          ? String(props.value)
          : "";

      return (
        <div data-testid="mock-widget" data-widget-id={props.id}>
          {displayValue}
        </div>
      );
    },
  ),
}));

describe("FieldListWidget", () => {
  it("renders label, description, and default row widgets", () => {
    render(
      <FieldListWidget
        id="contacts"
        key="contacts"
        schema={{ type: "array", title: "Contacts" }}
        label="Contacts"
        description="Add contacts"
        defaultSize={1}
        groupDefinition={[
          {
            widget: "Text",
            baseId: "contacts[~~index~~]--first_name",
            definition:
              "/properties/contact_people_test/items/properties/first_name",
            generalProps: {
              schema: { type: "string", title: "First Name" },
              rawErrors: [],
              options: {},
            },
          },
        ]}
        rawErrors={[]}
        requiredFields={[]}
        name={""}
      />,
    );

    expect(screen.getByText("Contacts")).toBeInTheDocument();
    expect(screen.getByText("Add contacts")).toBeInTheDocument();
    expect(screen.getByText(/entry\s+1/i)).toBeInTheDocument();
    expect(screen.getAllByTestId("mock-widget")).toHaveLength(1);
  });

  it("adds a row", async () => {
    const user = userEvent.setup();

    render(
      <FieldListWidget
        id="contacts"
        key="contacts"
        schema={{ type: "array", title: "Contacts" }}
        label="Contacts"
        defaultSize={1}
        groupDefinition={[
          {
            widget: "Text",
            baseId: "contacts[~~index~~]--first_name",
            definition: "",
            generalProps: {
              schema: { type: "string", title: "First Name" },
              rawErrors: [],
              options: {},
            },
          },
        ]}
        rawErrors={[]}
        requiredFields={[]}
        name={""}
      />,
    );

    await user.click(screen.getByRole("button", { name: /\+\s*add/i }));

    expect(screen.getByText(/entry\s+2/i)).toBeInTheDocument();
    expect(screen.getAllByTestId("mock-widget")).toHaveLength(2);
  });

  it("removes a row", async () => {
    const user = userEvent.setup();

    render(
      <FieldListWidget
        id="contacts"
        key="contacts"
        schema={{ type: "array", title: "Contacts" }}
        label="Contacts"
        defaultSize={2}
        groupDefinition={[
          {
            widget: "Text",
            baseId: "contacts[~~index~~]--first_name",
            definition: "",
            generalProps: {
              schema: { type: "string", title: "First Name" },
              rawErrors: [],
              options: {},
            },
          },
        ]}
        rawErrors={[]}
        requiredFields={[]}
        name={""}
      />,
    );

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(screen.queryByText(/entry\s+2/i)).not.toBeInTheDocument();
    expect(screen.getAllByTestId("mock-widget")).toHaveLength(1);
  });
});
