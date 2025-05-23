import { render, screen } from "@testing-library/react";
import {
  OpportunityDetail,
  Summary,
} from "src/types/opportunity/opportunityResponseTypes";

import OpportunityAwardInfo from "src/components/opportunity/OpportunityAwardInfo";

// Mock `useTranslations`
jest.mock("next-intl", () => ({
  useTranslations: jest.fn().mockReturnValue((key: string) => {
    const translations: { [key: string]: string } = {
      yes: "Yes",
      no: "No",
      programFunding: "Program Funding",
      expectedAwards: "Expected awards",
      awardCeiling: "Award Ceiling",
      awardFloor: "Award Floor",
      costSharing: "Cost sharing or matching requirement",
      fundingInstrument: "Funding instrument type",
      opportunityCategory: "Opportunity Category",
      opportunityCategoryExplanation: "Opportunity Category Explanation",
      fundingActivity: "Category of Funding Activity",
      categoryExplanation: "Category Explanation",
    };
    return translations[key] || key;
  }),
}));

const mockOpportunityData: OpportunityDetail = {
  summary: {
    estimated_total_program_funding: 5000000,
    expected_number_of_awards: 10,
    award_ceiling: 1000000,
    award_floor: 50000,
    isCostSharing: true,
    fundingInstruments: ["Grant", "Cooperative Agreement"],
    fundingCategories: ["Education", "Health"],
    fundingCategoryDescription: "Support for education and health initiatives",
  } as Summary,
  category: "Discretionary",
  categoryExplanation: "Funds allocated by agency discretion",
} as OpportunityDetail;

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
