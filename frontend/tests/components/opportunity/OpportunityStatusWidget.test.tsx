import { render, screen } from "@testing-library/react";
import {
  Opportunity,
  Summary,
} from "src/types/opportunity/opportunityResponseTypes";

import OpportunityStatusWidget from "src/components/opportunity/OpportunityStatusWidget";

jest.mock("src/utils/dateUtil", () => ({
  formatDate: jest.fn((date: string) => date),
}));

// Mock `useTranslations`
jest.mock("next-intl", () => ({
  useTranslations: jest.fn().mockReturnValue((key: string) => {
    const translations: { [key: string]: string } = {
      archived: "Archived: ",
      closed: "Closed: ",
      closing: "Closing: ",
      forecasted: "Forecasted",
      closing_warn:
        "Electronically submitted applications must be submitted no later than 5:00 p.m., ET, on the listed application due date.",
    };
    return translations[key] || key;
  }),
}));

const mockOpportunityData: Opportunity = {
  opportunity_status: "posted",
  summary: {
    close_date: "2024-12-01",
    archive_date: "2025-01-01",
  } as Summary,
} as Opportunity;

describe("OpportunityStatusWidget", () => {
  it("renders 'Posted' status tag correctly", () => {
    render(<OpportunityStatusWidget opportunityData={mockOpportunityData} />);
    expect(screen.getByText("Closing:")).toBeInTheDocument();
    expect(screen.getByText("2024-12-01")).toBeInTheDocument();
    const noticeElement = screen.getByText(
      /Electronically submitted applications/i,
    );
    expect(noticeElement).toBeInTheDocument();
  });

  it("renders 'Closed' status tag correctly", () => {
    const closedData = {
      ...mockOpportunityData,
      opportunity_status: "closed",
    };

    render(<OpportunityStatusWidget opportunityData={closedData} />);

    expect(screen.getByText("Closed:")).toBeInTheDocument();
    expect(screen.getByText("2024-12-01")).toBeInTheDocument();
  });

  it("renders 'Archived' status tag correctly", () => {
    const archivedData = {
      ...mockOpportunityData,
      opportunity_status: "archived",
    };

    render(<OpportunityStatusWidget opportunityData={archivedData} />);

    expect(screen.getByText("Archived:")).toBeInTheDocument();
    expect(screen.getByText("2025-01-01")).toBeInTheDocument();
  });

  it("renders 'Forecasted' status tag correctly", () => {
    const forecastedData = {
      ...mockOpportunityData,
      opportunity_status: "forecasted",
    };

    render(<OpportunityStatusWidget opportunityData={forecastedData} />);

    expect(screen.getByText("Forecasted")).toBeInTheDocument();
  });
});
