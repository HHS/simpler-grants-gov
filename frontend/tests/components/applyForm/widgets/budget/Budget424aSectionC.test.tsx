import { render, screen } from "@testing-library/react";

import React from "react";

import Budget424aSectionC from "src/components/applyForm/widgets/budget/Budget424aSectionC";

type MoneyString = string;

interface NonFederalResources {
  applicant_amount?: MoneyString;
  state_amount?: MoneyString;
  other_amount?: MoneyString;
  total_amount?: MoneyString;
}

interface ActivityItemValue {
  activity_title?: string;
  assistance_listing_number?: string;
  budget_summary?: { total_amount?: MoneyString };
  non_federal_resources?: NonFederalResources;
}

interface SectionCValue {
  activity_line_items?: ActivityItemValue[];
  total_non_federal_resources?: NonFederalResources;
}

const buildWidgetProps = (value: SectionCValue) => ({
  id: "section-c",
  schema: {},
  rawErrors: [],
  options: {},
  value,
});

describe("Budget424aSectionC", () => {
  it("renders applicant/state/other totals and row totals", () => {
    const value: SectionCValue = {
      activity_line_items: [
        {
          activity_title: "Service A",
          assistance_listing_number: "200.100",
          budget_summary: { total_amount: "25.00" },
          non_federal_resources: {
            applicant_amount: "5.00",
            state_amount: "2.50",
            other_amount: "1.00",
            total_amount: "8.50",
          },
        },
        { non_federal_resources: {} },
        { non_federal_resources: {} },
        { non_federal_resources: {} },
      ],
      total_non_federal_resources: {
        applicant_amount: "10.00",
        state_amount: "5.00",
        other_amount: "2.00",
        total_amount: "17.00",
      },
    };

    render(<Budget424aSectionC {...buildWidgetProps(value)} />);

    expect(
      screen.getByTestId(
        "activity_line_items[0]--non_federal_resources--applicant_amount",
      ),
    ).toHaveValue("5.00");

    expect(
      screen.getByTestId(
        "activity_line_items[0]--non_federal_resources--total_amount",
      ),
    ).toHaveValue("8.50");

    expect(
      screen.getByTestId("total_non_federal_resources--total_amount"),
    ).toHaveValue("17.00");
  });
});
