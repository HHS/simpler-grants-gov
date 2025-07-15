import { render, screen } from "@testing-library/react";

import OpportunityAwardGridRow from "src/components/opportunity/OpportunityAwardGridRow";

const mockTranslations: { [key: string]: string } = {
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

// Mock `useTranslations`
jest.mock("next-intl", () => ({
  useTranslations: jest.fn().mockReturnValue((key: string) => {
    return mockTranslations[key] || key;
  }),
}));

describe("OpportunityAwardGridRow", () => {
  it("renders the title and content as strings", () => {
    const title = "programFunding";
    const content = "Award Content";

    render(<OpportunityAwardGridRow title={title} content={content} />);

    const contentElement = screen.getByText(content);
    expect(contentElement).toBeInTheDocument();
    expect(contentElement).toHaveClass(
      "font-sans-sm text-bold margin-bottom-0",
    );

    const titleElement = screen.getByText(mockTranslations.programFunding);
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveClass("desktop-lg:font-sans-sm");
  });

  it("accepts number value for content", () => {
    const title = "programFunding";
    const content = 456;

    render(<OpportunityAwardGridRow title={title} content={content} />);

    const contentElement = screen.getByText(content.toString());
    expect(contentElement).toBeInTheDocument();
    expect(contentElement).toHaveClass(
      "font-sans-sm text-bold margin-bottom-0",
    );
  });

  it("renders defaults when data is not present (money)", () => {
    const title = "programFunding";
    const content = "";

    render(<OpportunityAwardGridRow title={title} content={content} />);

    const contentElement = screen.getByText("$--");
    expect(contentElement).toBeInTheDocument();
  });

  it("renders defaults when data is not present (not money)", () => {
    const title = "expectedAwards";
    const content = "";

    render(<OpportunityAwardGridRow title={title} content={content} />);

    const contentElement = screen.getByText("--");
    expect(contentElement).toBeInTheDocument();
  });
});
