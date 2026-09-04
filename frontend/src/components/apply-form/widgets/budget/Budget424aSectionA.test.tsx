import { render, screen } from "@testing-library/react";

import Budget424aSectionA from "src/components/apply-form/widgets/budget/Budget424aSectionA";
import budget424a from "./budget424a.mock.json";

const WidgetProps = {
  id: "test",
  schema: {},
  value: {
    ...budget424a.activity_line_items,
    ...budget424a.total_budget_summary,
  },
  options: {},
};

describe("Budget424aSectionA", () => {
  it("sets the correct default value", () => {
    render(<Budget424aSectionA {...WidgetProps} />);
    const A1 = screen.getByTestId("activity_line_items[0]--activity_title");
    expect(A1).toHaveValue("ABCDEFGHIJKLMNOPQRSTUVWXYZABC");

    const B1 = screen.getByTestId(
      "activity_line_items[0]--assistance_listing_number",
    );
    expect(B1).toHaveValue("ABCDFC");

    const C1 = screen.getByTestId(
      "activity_line_items[0]--budget_summary--federal_estimated_unobligated_amount",
    );
    expect(C1).toHaveValue("12.30");

    const D1 = screen.getByTestId(
      "activity_line_items[0]--budget_summary--non_federal_estimated_unobligated_amount",
    );
    expect(D1).toHaveValue("4.53");

    const E1 = screen.getByTestId(
      "activity_line_items[0]--budget_summary--federal_new_or_revised_amount",
    );
    expect(E1).toHaveValue("24.23");

    const F1 = screen.getByTestId(
      "activity_line_items[0]--budget_summary--non_federal_new_or_revised_amount",
    );
    expect(F1).toHaveValue("32.43");
  });

  // pre-existing summation labels were removed to avoid confusion
  it("does not render misleading summation labels", () => {
    render(<Budget424aSectionA {...WidgetProps} />);

    // Column G header
    expect(screen.queryByText("(sum of C-F)")).not.toBeInTheDocument();

    // Column G, rows 1-4
    for (let row = 1; row <= 4; row++) {
      expect(screen.queryByText(`Sum of row ${row}`)).not.toBeInTheDocument();
    }

    // Row 5, column A
    expect(screen.queryByText("(sum of 1-4)")).not.toBeInTheDocument();

    // Row 5, columns C-G
    for (const column of ["C", "D", "E", "F", "G"]) {
      expect(
        screen.queryByText(`Sum of column ${column}`),
      ).not.toBeInTheDocument();
    }

    // Still renders the plain "Total" labels
    expect(screen.getAllByText("Total").length).toBeGreaterThan(0);
  });
});
