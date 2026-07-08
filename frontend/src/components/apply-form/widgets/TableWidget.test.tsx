import { render, screen } from "@testing-library/react";
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
            rowHeader: "First Row",
            cells: [
              {
                type: "plainText",
                staticContent: "First value text",
              },
              {
                type: "readOnly",
                definition: "/properties/second_value",
                format: "dollar",
              },
            ],
          },
        ],
      },
    },
  };

  it("renders configured table headers, row headers, and cells", () => {
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
    expect(screen.getAllByRole("cell")).toHaveLength(2);

    expect(
      screen.getByRole("columnheader", { name: "Item" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "First Value" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Second Value" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("rowheader", { name: "First Row" }),
    ).toBeInTheDocument();

    expect(screen.getByText("First value text")).toBeInTheDocument();

    expect(
      screen.getByTestId("summary_table_test-First Row-1-read-only"),
    ).toHaveTextContent("");
  });

  it("throws when a row does not contain one cell for each data column", async () => {
    const { children: tableChildren, ...tableUiSchema } = props.uiSchemaField;

    const invalidProps: TableWidgetProps = {
      ...props,
      uiSchemaField: {
        ...tableUiSchema,
        children: {
          ...tableChildren,
          rows: [
            {
              rowHeader: "First Row",
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

    expect(error.message).toBe("Table row 1 must contain exactly 2 cells.");
  });
});
