import { render, screen } from "@testing-library/react";

import Budget424aSectionA from "src/components/applyForm/widgets/budget/Budget424aSectionA";
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
});
