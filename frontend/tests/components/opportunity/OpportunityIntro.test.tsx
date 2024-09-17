import {
  Opportunity,
  Summary,
} from "src/types/opportunity/opportunityResponseTypes";
import { render, screen } from "@testing-library/react";

import OpportunityIntro from "src/components/opportunity/OpportunityIntro";

// Mock `useTranslations`
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

const mockOpportunityData: Opportunity = {
  opportunity_title: "Test Opportunity",
  summary: {
    agency_name: "Test Agency",
  },
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
} as Opportunity;

describe("OpportunityIntro", () => {
  it("renders the opportunity title and agency name", () => {
    render(<OpportunityIntro opportunityData={mockOpportunityData} />);

    expect(screen.getByText("Test Opportunity")).toBeInTheDocument();
    expect(screen.getByText("Agency: Test Agency")).toBeInTheDocument();
  });

  it("renders assistance listings correctly", () => {
    render(<OpportunityIntro opportunityData={mockOpportunityData} />);

    expect(
      screen.getByText(/Assistance Listings:\s*12345\s*--\s*Test Program 1/),
    ).toBeInTheDocument();
    expect(screen.getByText("67890 -- Test Program 2")).toBeInTheDocument();
  });

  it("renders the formatted last updated date", () => {
    render(<OpportunityIntro opportunityData={mockOpportunityData} />);

    expect(
      screen.getByText("Last updated: August 10, 2024"),
    ).toBeInTheDocument();
  });

  it("handles null agency name and null assistance listings", () => {
    const opportunityDataWithNulls: Opportunity = {
      ...mockOpportunityData,
      summary: {
        agency_name: "",
      } as Summary,
      opportunity_assistance_listings: [],
    };

    render(<OpportunityIntro opportunityData={opportunityDataWithNulls} />);

    expect(screen.getByText("Agency: --")).toBeInTheDocument();
    expect(screen.getByText("Assistance Listings: --")).toBeInTheDocument(); // No assistance listings
  });

  it("handles null updated date", () => {
    const opportunityDataWithoutDate: Opportunity = {
      ...mockOpportunityData,
      updated_at: "",
    };

    render(<OpportunityIntro opportunityData={opportunityDataWithoutDate} />);

    expect(screen.getByText("Last updated: --")).toBeInTheDocument();
  });
});
