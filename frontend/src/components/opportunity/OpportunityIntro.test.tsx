import { render, screen } from "@testing-library/react";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import OpportunityIntro from "src/components/opportunity/OpportunityIntro";

jest.mock("next-intl", () => ({
  useTranslations: jest.fn().mockReturnValue((key: string) => {
    const translations: { [key: string]: string } = {
      agency: "Agency:",
      assistanceListings: "Assistance Listings:",
      lastUpdated: "Last updated:",
    };
    return translations[key] || key;
  }),
}));

const mockOpportunityData: OpportunityDetail = {
  opportunity_id: "63588df8-f2d1-44ed-a201-5804abba696a",
  legacy_opportunity_id: 1,
  opportunity_title: "Test Opportunity",
  agency_name: "Test Agency",
  opportunity_assistance_listings: [
    {
      assistance_listing_number: "12345",
      program_title: "Test Program 1",
    },
    {
      assistance_listing_number: "67890",
      program_title: "Test Program 2",
    },
  ],
  updated_at: "2024-08-10T10:00:00Z",
} as OpportunityDetail;

describe("OpportunityIntro", () => {
  it("renders the agency name", () => {
    render(<OpportunityIntro opportunityData={mockOpportunityData} />);

    expect(screen.getByText("Test Agency")).toBeInTheDocument();
  });
  it("renders assistance listings correctly", () => {
    render(<OpportunityIntro opportunityData={mockOpportunityData} />);

    expect(
      screen.getByText(/\s*12345\s*--\s*Test Program 1/),
    ).toBeInTheDocument();
    expect(screen.getByText("67890 -- Test Program 2")).toBeInTheDocument();
  });

  it("renders the formatted last updated date", () => {
    render(<OpportunityIntro opportunityData={mockOpportunityData} />);

    expect(screen.getByText("August 10, 2024")).toBeInTheDocument();
  });

  it("handles null agency name and null assistance listings", () => {
    const opportunityDataWithNulls: OpportunityDetail = {
      ...mockOpportunityData,
      agency_name: "",
      opportunity_assistance_listings: [],
    };

    render(<OpportunityIntro opportunityData={opportunityDataWithNulls} />);

    expect(
      screen.getByText((_, element) => element?.textContent === "Agency: --"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) => element?.textContent === "Assistance Listings: —",
      ),
    ).toBeInTheDocument(); // No assistance listings
  });

  it("handles null updated date", () => {
    const opportunityDataWithoutDate: OpportunityDetail = {
      ...mockOpportunityData,
      updated_at: "",
    };

    render(<OpportunityIntro opportunityData={opportunityDataWithoutDate} />);
    expect(
      screen.getByText(
        (_, element) => element?.textContent === "Last updated: --",
      ),
    ).toBeInTheDocument();
  });
  it("includes `Version History` link to legacy opportunity page", () => {
    render(<OpportunityIntro opportunityData={mockOpportunityData} />);

    const versionHistoryLink = screen.getByRole("link", {
      name: "versionHistory",
    });
    expect(versionHistoryLink).toBeInTheDocument();
    expect(versionHistoryLink).toHaveAttribute(
      "href",
      "https://www.grants.gov/search-results-detail/1",
    );
  });
});
