import { render, screen } from "@testing-library/react";

import React from "react";

import Budget424aSectionE from "src/components/applyForm/widgets/budget/Budget424aSectionE";

type MoneyString = string;

interface FederalFundEstimates {
  first_year_amount?: MoneyString;
  second_year_amount?: MoneyString;
  third_year_amount?: MoneyString;
  fourth_year_amount?: MoneyString;
}

interface ActivityItemValue {
  activity_title?: string;
  assistance_listing_number?: string;
  budget_summary?: { total_amount?: MoneyString };
  federal_fund_estimates?: FederalFundEstimates;
}

interface SectionEValue {
  activity_line_items?: ActivityItemValue[];
  total_federal_fund_estimates?: FederalFundEstimates;
}

const buildWidgetProps = (value: SectionEValue) => ({
  id: "section-e",
  schema: {},
  rawErrors: [],
  options: {},
  value,
});

describe("Budget424aSectionE", () => {
  it("renders future funding period values per year and totals", () => {
    const value: SectionEValue = {
      activity_line_items: [
        {
          activity_title: "Project Alpha",
          assistance_listing_number: "300.400",
          federal_fund_estimates: {
            first_year_amount: "5.00",
            second_year_amount: "6.00",
            third_year_amount: "7.00",
            fourth_year_amount: "8.00",
          },
        },
        { federal_fund_estimates: {} },
        { federal_fund_estimates: {} },
        { federal_fund_estimates: {} },
      ],
      total_federal_fund_estimates: {
        first_year_amount: "20.00",
        second_year_amount: "24.00",
        third_year_amount: "28.00",
        fourth_year_amount: "32.00",
      },
    };

    render(<Budget424aSectionE {...buildWidgetProps(value)} />);

    expect(
      screen.getByTestId(
        "activity_line_items[0]--federal_fund_estimates--first_year_amount",
      ),
    ).toHaveValue("5.00");

    expect(
      screen.getByTestId("total_federal_fund_estimates--fourth_year_amount"),
    ).toHaveValue("32.00");
  });
});
