import { readFileSync } from "fs";
import path from "path";
import { fireEvent, render, screen } from "@testing-library/react";
import { TableWidgetProps } from "src/types/applyForm/types";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

import TableWidget from "./TableWidget";

const printStylesPath = path.resolve(
  __dirname,
  "../../../../styles/_uswds-theme-custom-styles.scss",
);
const printStylesCss = readFileSync(printStylesPath, "utf8");

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

  it("applies the print-scoped table class used to force fixed table-layout in print", () => {
    render(
      <TableWidget
        {...props}
        schema={{}}
        rawErrors={[]}
        value={{}}
        options={{}}
      />,
    );
    expect(screen.getByTestId("table")).toHaveClass("applyform-budget-table");
  });

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

  it("uses the HTML field name as the editable input id for summary anchors", () => {
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
        value={{ administrative_and_legal_expenses: { total_cost: 100 } }}
        options={{}}
      />,
    );

    const input = screen.getByTestId("budget_424c_table_1-0-1-input");

    expect(input).toHaveAttribute(
      "id",
      "budget_information--administrative_and_legal_expenses--total_cost",
    );
    expect(input).toHaveAttribute(
      "name",
      "budget_information--administrative_and_legal_expenses--total_cost",
    );
  });

  it("uses the first column label as the row label and the column header for editable table input aria-labels", () => {
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
                {
                  type: "plainText",
                  staticContent: "Administrative and legal expenses",
                },
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
        value={{ administrative_and_legal_expenses: { total_cost: 100 } }}
        options={{}}
      />,
    );

    expect(screen.getByTestId("budget_424c_table_1-0-1-input")).toHaveAttribute(
      "aria-label",
      "Administrative and legal expenses, Total Cost",
    );
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

    // Verify error messages are rendered for both the editable input cell
    // and the readOnly (calculated) cell.
    expect(screen.getByText("First value error")).toBeInTheDocument();
    expect(screen.getByText("Second value error")).toBeInTheDocument();
    expect(screen.queryByText("Should not appear")).not.toBeInTheDocument();
  });

  it("renders validation errors on readOnly cells with a resolvable id for the error-summary link", () => {
    const rawErrors = [
      {
        field: "second_value",
        message: "Total allowable cost cannot be negative",
        type: "custom",
        value: null,
      },
    ];

    render(
      <TableWidget
        {...props}
        schema={{}}
        rawErrors={rawErrors}
        value={{ first_value: 100, second_value: -50 }}
        options={{}}
      />,
    );

    expect(
      screen.getByText("Total allowable cost cannot be negative"),
    ).toBeInTheDocument();

    const readOnlyCell = screen.getByTestId("summary_table_test-0-2-read-only");

    // The error-summary anchor at the top of the form links to
    // `#<cellName>`, so the readOnly cell must expose that same id for
    // getElementById()/the fragment link to resolve.
    expect(readOnlyCell).toHaveAttribute(
      "id",
      "summary_table_test[0]--second_value",
    );
    expect(readOnlyCell).toHaveAttribute("aria-invalid", "true");
    expect(readOnlyCell).toHaveClass("usa-input--error");
  });

  it("does not apply base-name fallback when multiple cells share the same suffix", () => {
    const propsWithAmbiguousSuffix: TableWidgetProps = {
      ...props,
      uiSchemaField: {
        ...props.uiSchemaField,
        children: {
          columns: [
            { columnHeader: "Item" },
            { columnHeader: "First Total" },
            { columnHeader: "Second Total" },
          ],
          rows: [
            {
              cells: [
                { type: "plainText", staticContent: "Row 1" },
                {
                  type: "input",
                  definition:
                    "/properties/budget_information/items/properties/administrative_and_legal_expenses/properties/total_cost",
                },
                {
                  type: "input",
                  definition:
                    "/properties/budget_information/items/properties/construction/properties/total_cost",
                },
              ],
            },
          ],
        },
      },
    };

    render(
      <TableWidget
        {...propsWithAmbiguousSuffix}
        schema={{}}
        rawErrors={[
          {
            field: "total_cost",
            message: "Total cost error",
            type: "custom",
            value: null,
          },
        ]}
        value={{}}
        options={{}}
      />,
    );

    expect(screen.queryByText("Total cost error")).not.toBeInTheDocument();
  });

  describe("print layout behavior", () => {
    it("keeps the interactive on-screen header widths driven by configured column.width", () => {
      const widthProps: TableWidgetProps = {
        ...props,
        uiSchemaField: {
          ...props.uiSchemaField,
          children: {
            columns: [
              { columnHeader: "Item", width: 50 },
              { columnHeader: "First Value", width: 25 },
              { columnHeader: "Second Value", width: 25 },
            ],
            rows: props.uiSchemaField.children.rows,
          },
        },
      };

      render(
        <TableWidget
          {...widthProps}
          schema={{}}
          rawErrors={[]}
          value={{ first_value: 100, second_value: 200 }}
          options={{}}
        />,
      );

      const headers = screen.getAllByRole("columnheader");
      expect(headers[0]).toHaveStyle("width: 50%");
      expect(headers[1]).toHaveStyle("width: 25%");
      expect(headers[2]).toHaveStyle("width: 25%");
    });

    it("computes print-only column widths from content, independent of configured column.width", () => {
      const widthProps: TableWidgetProps = {
        ...props,
        uiSchemaField: {
          ...props.uiSchemaField,
          children: {
            columns: [
              { columnHeader: "Item", width: 50 },
              { columnHeader: "First Value", width: 25 },
              { columnHeader: "Second Value", width: 25 },
            ],
            rows: props.uiSchemaField.children.rows,
          },
        },
      };

      render(
        <TableWidget
          {...widthProps}
          schema={{}}
          rawErrors={[]}
          value={{ first_value: 100, second_value: 200 }}
          options={{}}
        />,
      );

      const tableHtml = screen.getByTestId("table").innerHTML;
      const colStyles = Array.from(
        tableHtml.matchAll(/<col[^>]*style="([^"]*)"/g),
      ).map((match) => match[1]);
      const printWidths = colStyles.map((style) => {
        const match = /--applyform-print-col-width:\s*([\d.]+)%/.exec(style);
        return match ? `${match[1]}%` : "";
      });

      // Widths should sum to 100% but NOT equal the configured 50/25/25 split —
      // proving print sizing is content-derived, not copied from column.width.
      const numeric = printWidths.map((w) => parseFloat(w));
      const total = numeric.reduce((sum, w) => sum + w, 0);

      expect(total).toBeCloseTo(100, 1);
      expect(numeric).not.toEqual([50, 25, 25]);
    });

    it("does not inline print styles in the component; they live in the shared print stylesheet", () => {
      render(
        <TableWidget
          {...props}
          schema={{}}
          rawErrors={[]}
          value={{}}
          options={{}}
        />,
      );

      expect(screen.getByTestId("table")).not.toHaveAttribute("style");
      expect(printStylesCss).toMatch(/\.applyform-budget-table/);
    });

    it("prevents a table row from splitting across a page when printed", () => {
      const tableBlockMatch = printStylesCss.match(
        /\.applyform-budget-table\s*{[\s\S]*?\r?\n {2}}\r?\n/,
      );
      expect(tableBlockMatch).not.toBeNull();
      const tableBlock = tableBlockMatch![0];

      expect(tableBlock).toMatch(/tr\s*{[^}]*break-inside:\s*avoid;/);
      expect(tableBlock).toMatch(/tr\s*{[^}]*page-break-inside:\s*avoid;/);
    });

    it("resets overflow and max-height on the USWDS scrollable table wrapper during print so the table can paginate across pages", () => {
      expect(printStylesCss).toMatch(
        /\.usa-table-container--scrollable\s*{\s*overflow:\s*visible\s*!important;\s*max-height:\s*none\s*!important;/,
      );
    });

    it("scopes print-only layout changes to @media print, leaving the interactive form untouched", () => {
      render(
        <TableWidget
          {...props}
          schema={{}}
          rawErrors={[]}
          value={{}}
          options={{}}
        />,
      );

      // The print rules for .applyform-budget-table live inside an
      // @media print block in the shared stylesheet.
      const printBlockStart = printStylesCss.indexOf("@media print");
      expect(printBlockStart).toBeGreaterThan(-1);
      const printBlock = printStylesCss.slice(printBlockStart);
      expect(printBlock.indexOf(".applyform-budget-table")).toBeGreaterThan(-1);

      // No inline width leaks onto the table itself outside print.
      expect(screen.getByTestId("table")).not.toHaveAttribute("style");

      const tableHtml = screen.getByTestId("table").innerHTML;
      const colStyleStrings = Array.from(
        tableHtml.matchAll(/<col[^>]*style="([^"]*)"/g),
      ).map((match) => match[1]);
      expect(colStyleStrings).not.toHaveLength(0);
      colStyleStrings.forEach((style) => {
        expect(style).toContain("--applyform-print-col-width");
      });
    });

    it("assigns distinct print widths based on content for text and long numeric columns", () => {
      const longValueProps: TableWidgetProps = {
        ...props,
        uiSchemaField: {
          ...props.uiSchemaField,
          children: {
            columns: [
              { columnHeader: "Item" },
              { columnHeader: "First Value" },
              { columnHeader: "Second Value" },
            ],
            rows: props.uiSchemaField.children.rows,
          },
        },
      };

      render(
        <TableWidget
          {...longValueProps}
          schema={{}}
          rawErrors={[]}
          value={{ first_value: 100, second_value: 987654321 }}
          options={{}}
        />,
      );

      const tableHtml = screen.getByTestId("table").innerHTML;
      const colStyleStrings = Array.from(
        tableHtml.matchAll(/<col[^>]*style="([^"]*)"/g),
      ).map((match) => match[1]);
      const widths = colStyleStrings.map((style) => {
        const match = /--applyform-print-col-width:\s*([\d.]+)%/.exec(style);
        return match ? parseFloat(match[1]) : 0;
      });
      const textColWidth = widths[0];
      const longNumberColWidth = widths[2];

      expect(textColWidth).toBeGreaterThan(0);
      expect(longNumberColWidth).toBeGreaterThan(0);
      expect(textColWidth).not.toBe(longNumberColWidth);
    });
  });
});
