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
});
