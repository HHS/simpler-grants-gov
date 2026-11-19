import type { UISchemaElement } from "@jsonforms/core";
import type { RJSFSchema } from "@rjsf/utils";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { FormattedFormValidationWarning } from "src/types/applyForm/types";
import { shapeFormData } from "src/utils/applyForm/applyFormUtils";

import { JsonFormsFields } from "src/components/apply-form/jsonforms/JsonFormsFields";

// A list with a rule, a labeled group and a nested list in each entry, and a list inside an
// object: one example of each place a list can appear.
const schema: RJSFSchema = {
  type: "object",
  properties: {
    people: {
      type: "array",
      title: "Person",
      items: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", title: "Name" },
          has_email: { type: "string", title: "Has Email" },
          email: { type: "string", title: "Email" },
          phones: {
            type: "array",
            title: "Phone",
            items: {
              type: "object",
              properties: { number: { type: "string", title: "Number" } },
            },
          },
        },
      },
    },
    budget: {
      type: "object",
      properties: {
        line_items: {
          type: "array",
          title: "Line Item",
          items: {
            type: "object",
            properties: { amount: { type: "string", title: "Amount" } },
          },
        },
      },
    },
  },
};

const uiSchema = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/people",
      options: {
        detail: {
          type: "VerticalLayout",
          elements: [
            { type: "Control", scope: "#/properties/name" },
            {
              type: "Group",
              label: "Contact",
              elements: [
                { type: "Control", scope: "#/properties/has_email" },
                {
                  type: "Control",
                  scope: "#/properties/email",
                  rule: {
                    effect: "ENABLE",
                    condition: {
                      scope: "#/properties/has_email",
                      schema: { const: "yes" },
                    },
                  },
                },
              ],
            },
            { type: "Control", scope: "#/properties/phones" },
          ],
        },
      },
    },
    { type: "Control", scope: "#/properties/budget/properties/line_items" },
  ],
} as UISchemaElement;

const savedData = {
  people: [
    { name: "Ada", has_email: "yes", phones: [{ number: "555-0100" }] },
    { name: "Grace", phones: [{ number: "555-0200" }, { number: "555-0201" }] },
  ],
  budget: { line_items: [{ amount: "10.00" }] },
};

const renderForm = (errors: FormattedFormValidationWarning[] | null = null) =>
  render(
    <form data-testid="form">
      <JsonFormsFields
        errors={errors}
        formData={savedData}
        schema={schema}
        uiSchema={uiSchema}
      />
    </form>,
  );

describe("FieldListControl", () => {
  it("names each field with every list index on its path, so the save action reads it back", () => {
    renderForm();

    expect(screen.getByTestId("people[1]--name")).toHaveValue("Grace");
    expect(screen.getByTestId("people[1]--phones[1]--number")).toHaveValue(
      "555-0201",
    );
    expect(screen.getByTestId("budget--line_items[0]--amount")).toHaveValue(
      "10.00",
    );

    const form = screen.getByTestId<HTMLFormElement>("form");
    expect(shapeFormData(new FormData(form), schema)).toMatchObject(savedData);
  });

  it("heads a list one level below its section, and each entry one level below the list", () => {
    render(
      <JsonFormsFields
        errors={null}
        formData={savedData}
        schema={schema}
        uiSchema={{
          type: "VerticalLayout",
          elements: [
            {
              type: "Group",
              label: "Key People",
              elements: [
                (uiSchema as { elements: UISchemaElement[] }).elements[0],
              ],
            },
          ],
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 4, name: "Key People" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 5, name: "Person" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 6, name: "Person 1" }),
    ).toBeInTheDocument();
    // HTML stops at h6, so deeper headings use aria-level.
    expect(
      screen.getAllByRole("heading", { level: 7, name: "Phone" }),
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("heading", { level: 8, name: "Phone 1" }),
    ).toHaveLength(2);
  });

  it("applies a rule inside an entry to that entry", () => {
    renderForm();

    expect(screen.getByTestId("people[0]--email")).toBeEnabled();
    expect(screen.getByTestId("people[1]--email")).toBeDisabled();
  });

  it("re-evaluates a rule inside an entry when an answer in that entry changes", () => {
    renderForm();
    expect(screen.getByTestId("people[1]--email")).toBeDisabled();

    fireEvent.change(screen.getByTestId("people[1]--has_email"), {
      target: { value: "yes" },
    });

    expect(screen.getByTestId("people[1]--email")).toBeEnabled();
    expect(screen.getByTestId("people[0]--email")).toBeEnabled();
  });

  it("marks a field required by its entry's schema", () => {
    renderForm();

    expect(screen.getByTestId("people[0]--name")).toBeRequired();
    expect(screen.getByTestId("people[0]--email")).not.toBeRequired();
  });

  it("renders a labeled group in an entry as a sub-section without a section id", () => {
    renderForm();

    const contacts = screen.getAllByRole("group", { name: "Contact" });
    expect(contacts).toHaveLength(2);
    contacts.forEach((contact) => expect(contact).not.toHaveAttribute("id"));
  });

  it("shows a warning on the field in the entry it was reported for", () => {
    renderForm([
      {
        field: "$.people[1].phones[0].number",
        message: "Number is invalid",
        type: "pattern",
        value: null,
      },
    ]);

    expect(screen.getAllByText("Number is invalid")).toHaveLength(1);
  });

  it("adds and deletes entries, renaming the fields after a deleted one", () => {
    renderForm();
    const people = screen.getByLabelText("Person");

    fireEvent.click(
      within(people).getByRole("button", { name: "deleteEntry Person 1" }),
    );
    expect(screen.getByTestId("people[0]--name")).toHaveValue("Grace");
    expect(screen.queryByTestId("people[1]--name")).not.toBeInTheDocument();

    const addButtons = within(people).getAllByRole("button", {
      name: /addEntry/,
    });
    fireEvent.click(addButtons[addButtons.length - 1]);
    expect(screen.getByTestId("people[1]--name")).toHaveValue("");
  });
});
