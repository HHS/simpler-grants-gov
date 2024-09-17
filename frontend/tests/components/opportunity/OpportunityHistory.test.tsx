import { render, screen } from "@testing-library/react";

import { Opportunity } from "src/types/opportunity/opportunityResponseTypes";
import OpportunityHistory from "src/components/opportunity/OpportunityHistory";
import { formatDate } from "src/utils/dateUtil";

// Mock the formatDate function
jest.mock("src/utils/dateUtil", () => ({
  formatDate: jest.fn((date: string) => date),
}));

// Mock `useTranslations`
jest.mock("next-intl", () => ({
  useTranslations: jest.fn().mockReturnValue((key: string) => {
    const translations: { [key: string]: string } = {
      posted_date: "Posted date",
      closing_date: "Original closing date for applications",
      archive_date: "Archive date",
      version: "Version",
    };
    return translations[key] || key;
  }),
}));

const mockOpportunityData: Opportunity = {
  summary: {
    post_date: "2024-01-15",
    close_date: "2024-06-30",
    archive_date: "2024-12-31",
  },
} as Opportunity;

describe("OpportunityHistory", () => {
  it("renders history section with dates formatted correctly", () => {
    render(<OpportunityHistory opportunityData={mockOpportunityData} />);

    // Check for section heading
    expect(screen.getByText("History")).toBeInTheDocument();

    // Check version label
    expect(screen.getByText("Version:")).toBeInTheDocument();
    expect(screen.getByText("--")).toBeInTheDocument();

    // Check Posted Date
    expect(screen.getByText("Posted date:")).toBeInTheDocument();
    expect(screen.getByText("2024-01-15")).toBeInTheDocument();

    // Check Original Closing Date
    expect(
      screen.getByText("Original closing date for applications:"),
    ).toBeInTheDocument();
    expect(screen.getByText("2024-06-30")).toBeInTheDocument();
    expect(screen.getByText("Archive date:")).toBeInTheDocument();
    expect(screen.getByText("2024-12-31")).toBeInTheDocument();
  });

  it("calls formatDate for date fields", () => {
    render(<OpportunityHistory opportunityData={mockOpportunityData} />);

    // Check that formatDate is called with the right dates
    expect(formatDate).toHaveBeenCalledWith("2024-01-15");
    expect(formatDate).toHaveBeenCalledWith("2024-06-30");
    expect(formatDate).toHaveBeenCalledWith("2024-12-31");
  });
});
