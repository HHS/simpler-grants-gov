import { render, screen } from "@testing-library/react";

import { GeneralRecord } from "src/components/applyForm/types";
import Budget424aSectionD from "src/components/applyForm/widgets/budget/Budget424aSectionD";

const buildWidgetProps = (value: GeneralRecord) => ({
  id: "section-d",
  schema: {},
  rawErrors: [],
  options: {},
  value,
});

describe("Budget424aSectionD", () => {
  it("renders quarterly values and totals for federal and non-federal sources", () => {
    const value: GeneralRecord = {
      forecasted_cash_needs: {
        federal_forecasted_cash_needs: {
          first_quarter_amount: "1.00",
          second_quarter_amount: "2.00",
          third_quarter_amount: "3.00",
          fourth_quarter_amount: "4.00",
          total_amount: "10.00",
        },
        non_federal_forecasted_cash_needs: {
          first_quarter_amount: "0.50",
          second_quarter_amount: "0.50",
          third_quarter_amount: "0.50",
          fourth_quarter_amount: "0.50",
          total_amount: "2.00",
        },
        total_forecasted_cash_needs: {
          first_quarter_amount: "1.50",
          second_quarter_amount: "2.50",
          third_quarter_amount: "3.50",
          fourth_quarter_amount: "4.50",
          total_amount: "12.00",
        },
      },
    };

    render(<Budget424aSectionD {...buildWidgetProps(value)} />);

    expect(
      screen.getByTestId(
        "forecasted_cash_needs--federal_forecasted_cash_needs--first_quarter_amount",
      ),
    ).toHaveValue("1.00");
    expect(
      screen.getByTestId(
        "forecasted_cash_needs--non_federal_forecasted_cash_needs--total_amount",
      ),
    ).toHaveValue("2.00");
    expect(
      screen.getByTestId(
        "forecasted_cash_needs--total_forecasted_cash_needs--fourth_quarter_amount",
      ),
    ).toHaveValue("4.50");
  });
});
