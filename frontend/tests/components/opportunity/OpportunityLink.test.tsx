import { render, screen } from "@testing-library/react";
import {
  Opportunity,
  Summary,
} from "src/types/opportunity/opportunityResponseTypes";

import OpportunityLink from "src/components/opportunity/OpportunityLink";

// Mock `useTranslations`
jest.mock("next-intl", () => ({
  useTranslations: jest.fn().mockReturnValue((key: string) => {
    const translations: { [key: string]: string } = {
      title: "Link to additional information",
    };
    return translations[key] || key;
  }),
}));

const mockOpportunityData: Opportunity = {
  opportunity_title: "Test Opportunity",
  summary: {
    additional_info_url: "https://example.com",
    additional_info_url_description: "Click here for more information",
  } as Summary,
} as Opportunity;

describe("OpportunityLink", () => {
  it("renders the link with URL and description", () => {
    render(<OpportunityLink opportunityData={mockOpportunityData} />);

    const linkElement = screen.getByRole("link", {
      name: "Click here for more information",
    });
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute("href", "https://example.com");
  });

  it("renders no additional info link if URL is missing", () => {
    const mockDataWithoutUrl: Opportunity = {
      ...mockOpportunityData,
      summary: {
        ...mockOpportunityData.summary,
        additional_info_url: null,
      },
    };

    render(<OpportunityLink opportunityData={mockDataWithoutUrl} />);

    const linkElement = screen.queryByRole("link");
    expect(linkElement).not.toBeInTheDocument();
  });

  it("renders a placeholder if URL description is missing", () => {
    const mockDataWithoutDescription: Opportunity = {
      ...mockOpportunityData,
      summary: {
        ...mockOpportunityData.summary,
        additional_info_url_description: "",
      },
    };

    render(<OpportunityLink opportunityData={mockDataWithoutDescription} />);

    const linkElement = screen.getByRole("link", {
      name: "https://example.com",
    });
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute("href", "https://example.com");
  });

  it("renders a fallback when both URL and description are missing", () => {
    const mockDataWithoutUrlAndDescription: Opportunity = {
      ...mockOpportunityData,
      summary: {
        additional_info_url: null,
        additional_info_url_description: null,
      } as Summary,
    };

    render(
      <OpportunityLink opportunityData={mockDataWithoutUrlAndDescription} />,
    );

    const linkElement = screen.queryByRole("link");
    expect(linkElement).not.toBeInTheDocument();
  });
});
