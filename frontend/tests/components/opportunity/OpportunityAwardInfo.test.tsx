import { render, screen } from "@testing-library/react";
import {
  Opportunity,
  Summary,
} from "src/types/opportunity/opportunityResponseTypes";

import OpportunityAwardInfo from "src/components/opportunity/OpportunityAwardInfo";

// Mock `useTranslations`
jest.mock("next-intl", () => ({
  useTranslations: jest.fn().mockReturnValue((key: string) => {
    const translations: { [key: string]: string } = {
      yes: "Yes",
      no: "No",
      program_funding: "Program Funding",
      expected_awards: "Expected awards",
      award_ceiling: "Award Ceiling",
      award_floor: "Award Floor",
      cost_sharing: "Cost sharing or matching requirement",
      funding_instrument: "Funding instrument type",
      opportunity_category: "Opportunity Category",
      opportunity_category_explanation: "Opportunity Category Explanation",
      funding_activity: "Category of Funding Activity",
      category_explanation: "Category Explanation",
    };
    return translations[key] || key;
  }),
}));

const mockOpportunityData: Opportunity = {
  summary: {
    estimated_total_program_funding: 5000000,
    expected_number_of_awards: 10,
    award_ceiling: 1000000,
    award_floor: 50000,
    is_cost_sharing: true,
    funding_instruments: ["Grant", "Cooperative Agreement"],
    funding_categories: ["Education", "Health"],
    funding_category_description:
      "Support for education and health initiatives",
  } as Summary,
  category: "Discretionary",
  category_explanation: "Funds allocated by agency discretion",
} as Opportunity;

describe("OpportunityAwardInfo", () => {
  it("renders the award information correctly", () => {
    render(<OpportunityAwardInfo opportunityData={mockOpportunityData} />);

    // Check the headings
    expect(screen.getByText("Award")).toBeInTheDocument();

    // Check the main award grid info
    expect(screen.getByText("Program Funding")).toBeInTheDocument();
    expect(screen.getByText("$5,000,000")).toBeInTheDocument();

    expect(screen.getByText("Expected awards")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();

    expect(screen.getByText("Award Ceiling")).toBeInTheDocument();
    expect(screen.getByText("$1,000,000")).toBeInTheDocument();

    expect(screen.getByText("Award Floor")).toBeInTheDocument();
    expect(screen.getByText("$50,000")).toBeInTheDocument();
  });

  it("renders sub award information correctly", () => {
    render(<OpportunityAwardInfo opportunityData={mockOpportunityData} />);

    // Check cost sharing or matching requirement
    expect(
      screen.getByText("Cost sharing or matching requirement:"),
    ).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();

    // Check funding instrument type
    expect(screen.getByText("Funding instrument type:")).toBeInTheDocument();
    expect(screen.getByText("Grant")).toBeInTheDocument();
    expect(screen.getByText("Cooperative Agreement")).toBeInTheDocument();

    // Check opportunity category and explanation
    expect(screen.getByText("Opportunity Category:")).toBeInTheDocument();
    expect(screen.getByText("Discretionary")).toBeInTheDocument();

    expect(
      screen.getByText("Opportunity Category Explanation:"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Funds allocated by agency discretion"),
    ).toBeInTheDocument();

    // Check funding activity categories and explanation
    expect(
      screen.getByText("Category of Funding Activity:"),
    ).toBeInTheDocument();
    expect(screen.getByText("Education")).toBeInTheDocument();
    expect(screen.getByText("Health")).toBeInTheDocument();

    expect(screen.getByText("Category Explanation:")).toBeInTheDocument();
    expect(
      screen.getByText("Support for education and health initiatives"),
    ).toBeInTheDocument();
  });
});
