import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import FieldListWidget from "src/components/apply-form/widgets/FieldListWidget";

jest.mock("src/components/apply-form/widgets/WidgetRenderers", () => ({
  renderWidget: jest.fn(
    ({
      props,
    }: {
      props: {
        id: string;
        value?: unknown;
        rawErrors?: string[];
        additionalDescribedById?: string;
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
        <div>
          <input
            data-testid="mock-widget"
            data-widget-id={props.id}
            data-entry-description-id={props.additionalDescribedById}
            aria-label={props.id}
            value={displayValue}
            onChange={(event) => props.onChange?.(event.target.value)}
          />
          {props.rawErrors?.map((error) => (
            <p key={error}>{error}</p>
          ))}
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
    storagePath: ["first_name"],
    generalProps: {
      schema: { type: "string", title: "First Name" },
      rawErrors: [],
      options: {},
    },
  },
];

const nestedGroupDefinition = [
  {
    widget: "Text" as const,
    baseId: "contacts[~~index~~]--address--street1",
    definition:
      "/properties/contact_people_test/items/properties/address/properties/street1",
    storagePath: ["address", "street1"],
    generalProps: {
      schema: { type: "string", title: "Street 1" },
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

    expect(
      screen.getByRole("heading", { name: "Contacts" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Add contacts")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /contacts\s+1/i }),
    ).toBeInTheDocument();
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

    expect(
      screen.queryByRole("heading", { name: /contacts\s+1/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryAllByTestId("mock-widget")).toHaveLength(0);
  });

  it("renders no entries when minItems is undefined", () => {
    render(
      <FieldListWidget
        id="contacts"
        key="contacts"
        schema={{ type: "array", title: "Contacts" }}
        label="Contacts"
        groupDefinition={baseGroupDefinition}
        rawErrors={[]}
        requiredFields={[]}
        name="contacts"
      />,
    );

    expect(
      screen.queryByRole("heading", { name: /contacts\s+1/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryAllByTestId("mock-widget")).toHaveLength(0);
  });

  it("renders minItems number of entries", () => {
    render(
      <FieldListWidget
        id="contacts"
        key="contacts"
        schema={{ type: "array", title: "Contacts" }}
        label="Contacts"
        minItems={2}
        groupDefinition={baseGroupDefinition}
        rawErrors={[]}
        requiredFields={[]}
        name="contacts"
      />,
    );

    expect(
      screen.getByRole("heading", { name: /contacts\s+1/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /contacts\s+2/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("mock-widget")).toHaveLength(2);
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

    await user.click(screen.getByRole("button", { name: /addEntry/i }));

    expect(
      screen.getByRole("heading", { name: /contacts\s+2/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("mock-widget")).toHaveLength(2);
  });

  it("disables add when maxItems is reached", () => {
    render(
      <FieldListWidget
        id="contacts"
        key="contacts"
        schema={{ type: "array", title: "Contacts" }}
        label="Contacts"
        minItems={1}
        maxItems={1}
        groupDefinition={baseGroupDefinition}
        rawErrors={[]}
        requiredFields={[]}
        name="contacts"
      />,
    );

    expect(screen.getByRole("button", { name: /addEntry/i })).toBeDisabled();
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

    const deleteButtons = screen.getAllByRole("button", {
      name: /deleteEntry/i,
    });

    await user.click(deleteButtons[0]);

    expect(
      screen.queryByRole("heading", { name: /contacts\s+2/i }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByTestId("mock-widget")).toHaveLength(1);
  });

  it("disables delete when minItems is reached", () => {
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

    expect(
      screen.getByRole("button", { name: /deleteEntry Contacts 1/i }),
    ).toBeDisabled();
  });

  it("renders FieldList child errors inline", () => {
    render(
      <FieldListWidget
        id="contacts"
        key="contacts"
        schema={{ type: "array", title: "Contacts" }}
        label="Contacts"
        minItems={1}
        groupDefinition={baseGroupDefinition}
        rawErrors={[
          {
            type: "required",
            field: "$.contacts[0].first_name",
            message: "first_name is required",
            value: null,
            formatted: "First Name is required",
            definition:
              "/properties/contact_people_test/items/properties/first_name",
            htmlField: "contacts[0]--first_name",
          },
        ]}
        requiredFields={[]}
        name="contacts"
      />,
    );

    expect(screen.getByText("First Name is required")).toBeInTheDocument();
  });

  it("passes the FieldList entry heading id to child widgets", () => {
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

    const entryHeading = screen.getByRole("heading", {
      name: /contacts\s+1/i,
    });

    expect(screen.getByTestId("mock-widget")).toHaveAttribute(
      "data-entry-description-id",
      entryHeading.id,
    );
  });

  it("renders nested FieldList values from storagePath", () => {
    render(
      <FieldListWidget
        id="contacts"
        key="contacts"
        schema={{ type: "array", title: "Contacts" }}
        label="Contacts"
        minItems={1}
        value={[{ address: { street1: "123 Main" } }]}
        groupDefinition={nestedGroupDefinition}
        rawErrors={[]}
        requiredFields={[]}
        name="contacts"
      />,
    );

    expect(screen.getByLabelText("contacts[0]--address--street1")).toHaveValue(
      "123 Main",
    );
  });

  it("updates nested FieldList values using storagePath", async () => {
    const user = userEvent.setup();
    const onChangeMock = jest.fn();

    render(
      <FieldListWidget
        id="contacts"
        key="contacts"
        schema={{ type: "array", title: "Contacts" }}
        label="Contacts"
        minItems={1}
        value={[{}]}
        groupDefinition={nestedGroupDefinition}
        rawErrors={[]}
        requiredFields={[]}
        name="contacts"
        onChange={onChangeMock}
      />,
    );

    await user.type(
      screen.getByLabelText("contacts[0]--address--street1"),
      "123 Main",
    );

    expect(onChangeMock).toHaveBeenLastCalledWith([
      { address: { street1: "123 Main" } },
    ]);
  });

  it("marks the form dirty when a FieldList child field changes", async () => {
    const user = userEvent.setup();
    const markFormDirtyMock = jest.fn();

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
        formContext={{
          widgetSupport: {
            markFormDirty: markFormDirtyMock,
          },
        }}
      />,
    );

    await user.type(screen.getByLabelText("contacts[0]--first_name"), "Jane");

    expect(markFormDirtyMock).toHaveBeenCalled();
  });

  it("marks the form dirty when a FieldList row is added", async () => {
    const user = userEvent.setup();
    const markFormDirtyMock = jest.fn();

    render(
      <FieldListWidget
        id="contacts"
        key="contacts"
        schema={{ type: "array", title: "Contacts" }}
        label="Contacts"
        groupDefinition={baseGroupDefinition}
        rawErrors={[]}
        requiredFields={[]}
        name="contacts"
        formContext={{
          widgetSupport: {
            markFormDirty: markFormDirtyMock,
          },
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /addEntry/i }));

    expect(markFormDirtyMock).toHaveBeenCalledTimes(1);
  });

  it("preserves unsaved entry values when deleting another entry", async () => {
    const user = userEvent.setup();

    render(
      <FieldListWidget
        id="contacts"
        key="contacts"
        schema={{ type: "array", title: "Contacts" }}
        label="Contacts"
        minItems={2}
        maxItems={3}
        value={[{ first_name: "One" }, { first_name: "Two" }]}
        groupDefinition={baseGroupDefinition}
        rawErrors={[]}
        requiredFields={[]}
        name="contacts"
      />,
    );

    await user.click(screen.getByRole("button", { name: /addEntry/i }));
    await user.type(screen.getByLabelText("contacts[2]--first_name"), "Three");

    const deleteButtons = screen.getAllByRole("button", {
      name: /deleteEntry/i,
    });

    await user.click(deleteButtons[1]);

    expect(screen.getByLabelText("contacts[1]--first_name")).toHaveValue(
      "Three",
    );
  });

  it("marks the form dirty when a FieldList row is deleted", async () => {
    const user = userEvent.setup();
    const markFormDirtyMock = jest.fn();

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
        formContext={{
          widgetSupport: {
            markFormDirty: markFormDirtyMock,
          },
        }}
      />,
    );

    const deleteButtons = screen.getAllByRole("button", {
      name: /deleteEntry/i,
    });

    await user.click(deleteButtons[0]);

    expect(markFormDirtyMock).toHaveBeenCalledTimes(1);
  });
});
