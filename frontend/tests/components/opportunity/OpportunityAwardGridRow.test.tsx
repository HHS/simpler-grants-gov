import { render, screen } from "@testing-library/react";

import OpportunityAwardGridRow from "src/components/opportunity/OpportunityAwardGridRow";

const mockTranslations: { [key: string]: string } = {
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

// Mock `useTranslations`
jest.mock("next-intl", () => ({
  useTranslations: jest.fn().mockReturnValue((key: string) => {
    return mockTranslations[key] || key;
  }),
}));

describe("OpportunityAwardGridRow", () => {
  it("renders the title and content as strings", () => {
    const title = "program_funding";
    const content = "Award Content";

    render(<OpportunityAwardGridRow title={title} content={content} />);

    const contentElement = screen.getByText(content);
    expect(contentElement).toBeInTheDocument();
    expect(contentElement).toHaveClass(
      "font-sans-sm text-bold margin-bottom-0",
    );

    const titleElement = screen.getByText(mockTranslations.program_funding);
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveClass("desktop-lg:font-sans-sm margin-top-0");
  });

  it("accepts number value for content", () => {
    const title = "program_funding";
    const content = 456;

    render(<OpportunityAwardGridRow title={title} content={content} />);

    const contentElement = screen.getByText(content.toString());
    expect(contentElement).toBeInTheDocument();
    expect(contentElement).toHaveClass(
      "font-sans-sm text-bold margin-bottom-0",
    );
  });

  it("renders defaults when data is not present (money)", () => {
    const title = "program_funding";
    const content = "";

    render(<OpportunityAwardGridRow title={title} content={content} />);

    const contentElement = screen.getByText("$--");
    expect(contentElement).toBeInTheDocument();
  });

  it("renders defaults when data is not present (not money)", () => {
    const title = "expected_awards";
    const content = "";

    render(<OpportunityAwardGridRow title={title} content={content} />);

    const contentElement = screen.getByText("--");
    expect(contentElement).toBeInTheDocument();
  });
});
