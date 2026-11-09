import { render, screen } from "@testing-library/react";
import {
  BaseOpportunity,
  Summary,
} from "src/types/opportunity/opportunityResponseTypes";

import OpportunityLink from "./OpportunityLink";

// Mock `useTranslations`
jest.mock("next-intl", () => ({
  useTranslations: jest.fn().mockReturnValue((key: string) => {
    const translations: { [key: string]: string } = {
      title: "Link to additional information",
    };
    return translations[key] || key;
  }),
}));

const mockOpportunityData: BaseOpportunity = {
  opportunity_title: "Test Opportunity",
  summary: {
    additional_info_url: "https://example.com",
    additional_info_url_description: "Click here for more information",
  } as Summary,
} as BaseOpportunity;

describe("OpportunityLink", () => {
  it("renders the link with URL and description", () => {
    render(<OpportunityLink opportunityData={mockOpportunityData} />);

    const linkElement = screen.getByRole("link", {
      name: "Click here for more information",
    });
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute("href", "https://example.com");
  });

  it("renders the link as an unbulleted list item that opens in a new tab", () => {
    render(<OpportunityLink opportunityData={mockOpportunityData} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(1);

    const linkElement = screen.getByRole("link", {
      name: "Click here for more information",
    });
    expect(linkElement).toHaveAttribute("target", "_blank");
    expect(linkElement).toHaveAttribute("rel", "noopener noreferrer");
  });

  it.each([null, "", "   "])(
    "renders the fallback once when the URL is %p",
    (url) => {
      render(
        <OpportunityLink
          opportunityData={{
            ...mockOpportunityData,
            summary: {
              additional_info_url: url,
              additional_info_url_description: null,
            } as Summary,
          }}
        />,
      );

      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
      expect(screen.getAllByText("noAdditionalInfo")).toHaveLength(1);
    },
  );

  it("renders the fallback once when both the URL and description are empty", () => {
    render(
      <OpportunityLink
        opportunityData={{
          ...mockOpportunityData,
          summary: {
            additional_info_url: "",
            additional_info_url_description: "",
          } as Summary,
        }}
      />,
    );

    expect(screen.getAllByText("noAdditionalInfo")).toHaveLength(1);
  });

  it("renders the URL as the link text when the description is empty", () => {
    render(
      <OpportunityLink
        opportunityData={{
          ...mockOpportunityData,
          summary: {
            ...mockOpportunityData.summary,
            additional_info_url_description: "",
          },
        }}
      />,
    );

    const linkElement = screen.getByRole("link", {
      name: "https://example.com",
    });
    expect(linkElement).toHaveAttribute("href", "https://example.com");
  });
});
