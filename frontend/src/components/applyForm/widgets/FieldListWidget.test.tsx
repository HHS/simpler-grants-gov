import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import FieldListWidget from "src/components/applyForm/widgets/FieldListWidget";

jest.mock("src/components/applyForm/widgets/WidgetRenderers", () => ({
  renderWidget: jest.fn(
    ({
      props,
    }: {
      props: {
        id: string;
        value?: unknown;
        onChange?: (value: unknown) => void;
      };
    }) => {
      const displayValue =
        typeof props.value === "string" ||
        typeof props.value === "number" ||
        typeof props.value === "boolean"
          ? String(props.value)
          : "";

      return (
        <input
          data-testid="mock-widget"
          data-widget-id={props.id}
          aria-label={props.id}
          value={displayValue}
          onChange={(event) => props.onChange?.(event.target.value)}
        />
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
  it("renders label, description, and default row widgets", () => {
    render(
      <FieldListWidget
        id="contacts"
        key="contacts"
        schema={{ type: "array", title: "Contacts" }}
        label="Contacts"
        description="Add contacts"
        defaultSize={1}
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

  it("adds a row", async () => {
    const user = userEvent.setup();

    render(
      <FieldListWidget
        id="contacts"
        key="contacts"
        schema={{ type: "array", title: "Contacts" }}
        label="Contacts"
        defaultSize={1}
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

  it("removes a row", async () => {
    const user = userEvent.setup();

    render(
      <FieldListWidget
        id="contacts"
        key="contacts"
        schema={{ type: "array", title: "Contacts" }}
        label="Contacts"
        defaultSize={2}
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

  it("marks the form edited when a FieldList child field changes", async () => {
    const user = userEvent.setup();
    const onFormEditedMock = jest.fn();

    render(
      <FieldListWidget
        id="contacts"
        key="contacts"
        schema={{ type: "array", title: "Contacts" }}
        label="Contacts"
        defaultSize={1}
        groupDefinition={baseGroupDefinition}
        rawErrors={[]}
        requiredFields={[]}
        name="contacts"
        formContext={{
          widgetSupport: {
            onFormEdited: onFormEditedMock,
          },
        }}
      />,
    );

    await user.type(screen.getByLabelText("contacts[0]--first_name"), "Jane");

    expect(onFormEditedMock).toHaveBeenCalled();
  });

  it("marks the form edited when a FieldList row is added", async () => {
    const user = userEvent.setup();
    const onFormEditedMock = jest.fn();

    render(
      <FieldListWidget
        id="contacts"
        key="contacts"
        schema={{ type: "array", title: "Contacts" }}
        label="Contacts"
        defaultSize={1}
        groupDefinition={baseGroupDefinition}
        rawErrors={[]}
        requiredFields={[]}
        name="contacts"
        formContext={{
          widgetSupport: {
            onFormEdited: onFormEditedMock,
          },
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /\+\s*add/i }));

    expect(onFormEditedMock).toHaveBeenCalledTimes(1);
  });

  it("marks the form edited when a FieldList row is deleted", async () => {
    const user = userEvent.setup();
    const onFormEditedMock = jest.fn();

    render(
      <FieldListWidget
        id="contacts"
        key="contacts"
        schema={{ type: "array", title: "Contacts" }}
        label="Contacts"
        defaultSize={2}
        groupDefinition={baseGroupDefinition}
        rawErrors={[]}
        requiredFields={[]}
        name="contacts"
        formContext={{
          widgetSupport: {
            onFormEdited: onFormEditedMock,
          },
        }}
      />,
    );

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(onFormEditedMock).toHaveBeenCalledTimes(1);
  });
});
