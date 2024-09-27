import { render, screen } from "@testing-library/react";

import OpportunityAwardGridRow from "src/components/opportunity/OpportunityAwardGridRow";

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

describe("OpportunityAwardGridRow", () => {
  it("renders the title and content as strings", () => {
    const title = "Award Title";
    const content = "Award Content";

    render(<OpportunityAwardGridRow title={title} content={content} />);

    const contentElement = screen.getByText(content);
    expect(contentElement).toBeInTheDocument();
    expect(contentElement).toHaveClass(
      "font-sans-sm text-bold margin-bottom-0",
    );

    const titleElement = screen.getByText(title);
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveClass("desktop-lg:font-sans-sm margin-top-0");
  });

  it("renders the title and content as numbers", () => {
    const title = 123;
    const content = 456;

    render(<OpportunityAwardGridRow title={title} content={content} />);

    const contentElement = screen.getByText(content.toString());
    expect(contentElement).toBeInTheDocument();
    expect(contentElement).toHaveClass(
      "font-sans-sm text-bold margin-bottom-0",
    );

    const titleElement = screen.getByText(title.toString());
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveClass("desktop-lg:font-sans-sm margin-top-0");
  });
});
