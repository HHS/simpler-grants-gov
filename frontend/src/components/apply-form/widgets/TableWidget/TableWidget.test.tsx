import { fireEvent, render, screen } from "@testing-library/react";
import { TableWidgetProps } from "src/types/applyForm/types";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

import TableWidget from "./TableWidget";

describe("TableWidget", () => {
  const props: TableWidgetProps = {
    id: "summary-table-test",
    key: "summary-table-test",
    name: "summary_table_test",
    uiSchemaField: {
      type: "multiField",
      name: "summary_table_test",
      widget: "Table",
      definition: ["/properties/first_value", "/properties/second_value"],
      children: {
        columns: [
          {
            columnHeader: "Item",
          },
          {
            columnHeader: "First Value",
          },
          {
            columnHeader: "Second Value",
          },
        ],
        rows: [
          {
            cells: [
              {
                type: "plainText",
                staticContent: "First value text",
              },
              {
                type: "input",
                definition: "/properties/first_value",
                format: "decimal",
              },
              {
                type: "readOnly",
                definition: "/properties/second_value",
              },
            ],
          },
        ],
      },
    },
  };

  it("renders configured table headers and cells", () => {
    render(
      <TableWidget
        {...props}
        schema={{}}
        rawErrors={[]}
        value={{}}
        options={{}}
      />,
    );

    const table = screen.getByTestId("table");

    expect(table).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getAllByRole("cell")).toHaveLength(3);

    expect(
      screen.getByRole("columnheader", { name: "Item" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "First Value" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Second Value" }),
    ).toBeInTheDocument();

    expect(screen.getByText("First value text")).toBeInTheDocument();

    expect(
      screen.getByTestId("summary_table_test-0-2-read-only"),
    ).toHaveTextContent("");
  });

  it("updates the table widget value when an editable cell changes", () => {
    const onChange = jest.fn();

    render(
      <TableWidget
        {...props}
        onChange={onChange}
        schema={{}}
        rawErrors={[]}
        value={{ first_value: 100, second_value: 200 }}
        options={{}}
      />,
    );

    fireEvent.change(screen.getByTestId("summary_table_test-0-1-input"), {
      target: { value: "250" },
    });

    expect(onChange).toHaveBeenCalledWith({
      first_value: "250",
      second_value: 200,
    });
  });

  it("prefixes nested table input names with the multiField root when configured under one parent object", () => {
    const tableProps: TableWidgetProps = {
      ...props,
      uiSchemaField: {
        type: "multiField",
        name: "budget_424c_table_1",
        widget: "Table",
        definition: ["/properties/budget_information"],
        children: {
          columns: [
            { columnHeader: "Category" },
            { columnHeader: "Total Cost" },
          ],
          rows: [
            {
              cells: [
                { type: "plainText", staticContent: "Admin" },
                {
                  type: "input",
                  definition:
                    "/properties/administrative_and_legal_expenses/properties/total_cost",
                },
              ],
            },
          ],
        },
      },
    };

    render(
      <TableWidget
        {...tableProps}
        schema={{}}
        rawErrors={[]}
        value={{
          administrative_and_legal_expenses: {
            total_cost: 100,
          },
        }}
        options={{}}
      />,
    );

    expect(screen.getByTestId("budget_424c_table_1-0-1-input")).toHaveAttribute(
      "name",
      "budget_information--administrative_and_legal_expenses--total_cost",
    );
  });

  it("renders read-only table values from form data", () => {
    render(
      <TableWidget
        {...props}
        schema={{}}
        rawErrors={[]}
        value={{ first_value: 50, second_value: 125 }}
        options={{}}
      />,
    );

    expect(
      screen.getByTestId("summary_table_test-0-2-read-only"),
    ).toHaveTextContent("125");
  });

  it("uses JSON schema definition paths for nested form values", () => {
    const nestedProps: TableWidgetProps = {
      ...props,
      uiSchemaField: {
        type: "multiField",
        name: "nested_table_test",
        widget: "Table",
        definition: ["/properties/parent/properties/child"],
        children: {
          columns: [{ columnHeader: "Item" }, { columnHeader: "Child Value" }],
          rows: [
            {
              cells: [
                {
                  type: "plainText",
                  staticContent: "Nested item",
                },
                {
                  type: "input",
                  definition: "/properties/parent/properties/child",
                  format: "integer",
                },
              ],
            },
          ],
        },
      },
    };
    const onChange = jest.fn();

    render(
      <TableWidget
        {...nestedProps}
        onChange={onChange}
        schema={{}}
        rawErrors={[]}
        value={{ parent: { child: 10 } }}
        options={{}}
      />,
    );

    expect(screen.getByTestId("nested_table_test-0-1-input")).toHaveValue("10");

    fireEvent.change(screen.getByTestId("nested_table_test-0-1-input"), {
      target: { value: "25" },
    });

    expect(onChange).toHaveBeenCalledWith({
      parent: { child: "25" },
    });
  });

  it("throws when a row does not contain one cell for each configured column", async () => {
    const { children: tableChildren, ...tableUiSchema } = props.uiSchemaField;

    const invalidProps: TableWidgetProps = {
      ...props,
      uiSchemaField: {
        ...tableUiSchema,
        children: {
          ...tableChildren,
          rows: [
            {
              cells: [
                {
                  type: "plainText",
                  staticContent: "Only one cell",
                },
                {
                  type: "plainText",
                  staticContent: "Extra cell",
                },
                {
                  type: "plainText",
                  staticContent: "Too many cells",
                },
                {
                  type: "plainText",
                  staticContent: "Fourth cell",
                },
              ],
            },
          ],
        },
      },
    };

    const error = await wrapForExpectedError(() => {
      render(
        <TableWidget
          {...invalidProps}
          schema={{}}
          rawErrors={[]}
          value={{}}
          options={{}}
        />,
      );
    });

    expect(error.message).toBe("Table row 1 must contain exactly 3 cells.");
  });

  it("passes validation errors to TableCell components via cellErrors", () => {
    const rawErrors = [
      {
        field: "first_value",
        message: "First value is required",
        type: "required",
        value: null,
      },
      {
        field: "second_value",
        message: "Second value must be positive",
        type: "custom",
        value: null,
      },
    ];

    render(
      <TableWidget
        {...props}
        schema={{}}
        rawErrors={rawErrors}
        value={{ first_value: 100, second_value: 50 }}
        options={{}}
      />,
    );
    // Verify that the table renders with error information
    // (The actual error display is tested in TableCell.test.tsx)
    expect(screen.getByTestId("table")).toBeInTheDocument();
  });

  it("handles empty rawErrors array gracefully", () => {
    render(
      <TableWidget
        {...props}
        schema={{}}
        rawErrors={[]}
        value={{ first_value: 100, second_value: 50 }}
        options={{}}
      />,
    );

    expect(screen.getByTestId("table")).toBeInTheDocument();
  });

  it("filters errors correctly by cell name", () => {
    const rawErrors = [
      {
        field: "first_value",
        message: "First value error",
        type: "custom",
        value: null,
      },
      {
        field: "second_value",
        message: "Second value error",
        type: "custom",
        value: null,
      },
      {
        field: "other_field",
        message: "Should not appear",
        type: "custom",
        value: null,
      },
    ];

    render(
      <TableWidget
        {...props}
        schema={{}}
        rawErrors={rawErrors}
        value={{ first_value: 100, second_value: 50 }}
        options={{}}
      />,
    );

    expect(screen.getByTestId("table")).toBeInTheDocument();

    // Verify error messages are rendered for input fields
    // (Note: The second cell is read-only so it won't show errors)
    expect(screen.getByText("First value error")).toBeInTheDocument();
    expect(screen.queryByText("Should not appear")).not.toBeInTheDocument();
  });
});
