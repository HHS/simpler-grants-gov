import { render, screen } from "@testing-library/react";

import React from "react";

import Budget424aSectionB from "src/components/applyForm/widgets/budget/Budget424aSectionB";

type MoneyString = string;

interface BudgetCategories {
  personnel_amount?: MoneyString;
  fringe_benefits_amount?: MoneyString;
  travel_amount?: MoneyString;
  equipment_amount?: MoneyString;
  supplies_amount?: MoneyString;
  contractual_amount?: MoneyString;
  construction_amount?: MoneyString;
  other_amount?: MoneyString;
  total_direct_charge_amount?: MoneyString;
  total_indirect_charge_amount?: MoneyString;
  total_amount?: MoneyString;
  program_income_amount?: MoneyString;
}

interface ActivityItemValue {
  activity_title?: string;
  assistance_listing_number?: string;
  budget_categories?: BudgetCategories;
}

interface SectionBValue {
  activity_line_items?: ActivityItemValue[];
  total_budget_categories?: BudgetCategories;
}

const buildWidgetProps = (value: SectionBValue) => ({
  id: "section-b",
  schema: {},
  rawErrors: [],
  options: {},
  value,
});

describe("Budget424aSectionB", () => {
  it("renders activity category cells and totals with provided values", () => {
    const value: SectionBValue = {
      activity_line_items: [
        {
          activity_title: "Activity One",
          assistance_listing_number: "100.200",
          budget_categories: {
            personnel_amount: "10.00",
            fringe_benefits_amount: "1.50",
            travel_amount: "3.00",
            equipment_amount: "2.00",
            supplies_amount: "1.00",
            contractual_amount: "4.00",
            construction_amount: "0.00",
            other_amount: "0.50",
            total_direct_charge_amount: "22.00",
            total_indirect_charge_amount: "2.00",
            total_amount: "24.00",
            program_income_amount: "1.00",
          },
        },
        { budget_categories: {} },
        { budget_categories: {} },
        { budget_categories: {} },
      ],
      total_budget_categories: {
        personnel_amount: "40.00",
        fringe_benefits_amount: "6.00",
        travel_amount: "12.00",
        equipment_amount: "8.00",
        supplies_amount: "4.00",
        contractual_amount: "16.00",
        construction_amount: "0.00",
        other_amount: "2.00",
        total_direct_charge_amount: "88.00",
        total_indirect_charge_amount: "8.00",
        total_amount: "96.00",
        program_income_amount: "4.00",
      },
    };

    render(<Budget424aSectionB {...buildWidgetProps(value)} />);

    expect(
      screen.getByTestId(
        "activity_line_items[0]--budget_categories--personnel_amount",
      ),
    ).toHaveValue("10.00");

    expect(
      screen.getByTestId("total_budget_categories--total_amount"),
    ).toHaveValue("96.00");

    expect(
      screen.getByTestId("total_budget_categories--program_income_amount"),
    ).toHaveValue("4.00");
  });
});
