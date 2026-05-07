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

const baseGroupDefinition = [
  {
    widget: "Text" as const,
    baseId: "contacts[~~index~~]--first_name",
    definition: "/properties/contact_people_test/items/properties/first_name",
    generalProps: {
      schema: { type: "string", title: "First Name" },
      rawErrors: [],
      options: {},
    },
  },
];

describe("FieldListWidget", () => {
  it("renders label, description, and minimum entry widgets", () => {
    render(
      <FieldListWidget
        id="contacts"
        key="contacts"
        schema={{ type: "array", title: "Contacts" }}
        label="Contacts"
        description="Add contacts"
        minItems={1}
        groupDefinition={baseGroupDefinition}
        rawErrors={[]}
        requiredFields={[]}
        name="contacts"
      />,
    );

    expect(screen.getByText("Contacts")).toBeInTheDocument();
    expect(screen.getByText("Add contacts")).toBeInTheDocument();
    expect(screen.getByText(/entry\s+1/i)).toBeInTheDocument();
    expect(screen.getAllByTestId("mock-widget")).toHaveLength(1);
  });

  it("renders no entries when minItems is 0", () => {
    render(
      <FieldListWidget
        id="contacts"
        key="contacts"
        schema={{ type: "array", title: "Contacts" }}
        label="Contacts"
        minItems={0}
        groupDefinition={baseGroupDefinition}
        rawErrors={[]}
        requiredFields={[]}
        name="contacts"
      />,
    );

    expect(screen.queryByText(/entry\s+1/i)).not.toBeInTheDocument();
    expect(screen.queryAllByTestId("mock-widget")).toHaveLength(0);
  });

  it("adds a row", async () => {
    const user = userEvent.setup();

    render(
      <FieldListWidget
        id="contacts"
        key="contacts"
        schema={{ type: "array", title: "Contacts" }}
        label="Contacts"
        minItems={1}
        groupDefinition={baseGroupDefinition}
        rawErrors={[]}
        requiredFields={[]}
        name="contacts"
      />,
    );

    await user.click(screen.getByRole("button", { name: /\+\s*add/i }));

    expect(screen.getByText(/entry\s+2/i)).toBeInTheDocument();
    expect(screen.getAllByTestId("mock-widget")).toHaveLength(2);
  });

  it("removes a row without going below minItems", async () => {
    const user = userEvent.setup();

    render(
      <FieldListWidget
        id="contacts"
        key="contacts"
        schema={{ type: "array", title: "Contacts" }}
        label="Contacts"
        minItems={1}
        value={[{}, {}]}
        groupDefinition={baseGroupDefinition}
        rawErrors={[]}
        requiredFields={[]}
        name="contacts"
      />,
    );

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(screen.queryByText(/entry\s+2/i)).not.toBeInTheDocument();
    expect(screen.getAllByTestId("mock-widget")).toHaveLength(1);
  });
});
