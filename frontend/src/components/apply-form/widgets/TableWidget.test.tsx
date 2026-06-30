import { render, screen } from "@testing-library/react";
import { TableWidgetProps } from "src/types/applyForm/types";

import TableWidget from "./TableWidget";

describe("TableWidget", () => {
  const props: TableWidgetProps = {
    id: "summary-table-test",
    key: "summary-table-test",
    name: "summary_table_test",
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
  };

  it("renders the table placeholder with its name", () => {
    render(<TableWidget {...props} />);

    const placeholder = screen.getByTestId("table-widget-placeholder");

    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveAttribute(
      "data-table-name",
      "summary_table_test",
    );
  });
});
