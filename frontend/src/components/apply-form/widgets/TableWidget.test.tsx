import { render, screen } from "@testing-library/react";
import { TableWidgetProps } from "src/types/applyForm/types";

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
      definition: ["/properties/first_value"],
      children: {
        columns: [
          {
            columnHeader: "Item",
          },
        ],
        rows: [
          {
            rowHeader: "First Row",
            cells: [
              {
                type: "plainText",
                staticContent: "First Row",
              },
            ],
          },
        ],
      },
    },
  };

  it("renders the table placeholder with its name", () => {
    render(
      <TableWidget
        {...props}
        schema={{}}
        rawErrors={[]}
        value={{}}
        options={{}}
      />,
    );

    const placeholder = screen.getByTestId("table-widget-placeholder");

    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveAttribute(
      "data-table-name",
      "summary_table_test",
    );
    expect(placeholder).toHaveAttribute("data-table-column-count", "1");
    expect(placeholder).toHaveAttribute("data-table-row-count", "1");
  });
});
