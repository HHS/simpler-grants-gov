import { render, screen } from "@testing-library/react";
import {
  OpportunityDetail,
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
    };
    return translations[key] || key;
  }),
}));

const createMockOpportunityData = (
  overrides: Partial<OpportunityDetail>,
): OpportunityDetail => ({
  ...mockOpportunityData,
  ...overrides,
});

const mockOpportunityData: OpportunityDetail = {
  opportunity_status: "posted",
  summary: {
    close_date: "2024-12-01",
    archive_date: "2025-01-01",
    close_date_description: "Electronically submitted applications",
  } as Summary,
} as OpportunityDetail;

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
    render(
      <OpportunityStatusWidget
        opportunityData={createMockOpportunityData({
          opportunity_status: "closed",
        })}
      />,
    );

    expect(screen.getByText("Closed:")).toBeInTheDocument();
    expect(screen.getByText("2024-12-01")).toBeInTheDocument();
  });

  it("renders 'Archived' status tag correctly", () => {
    render(
      <OpportunityStatusWidget
        opportunityData={createMockOpportunityData({
          opportunity_status: "archived",
        })}
      />,
    );

    expect(screen.getByText("Archived:")).toBeInTheDocument();
    expect(screen.getByText("2025-01-01")).toBeInTheDocument();
  });

  it("renders 'Forecasted' status tag correctly", () => {
    render(
      <OpportunityStatusWidget
        opportunityData={createMockOpportunityData({
          opportunity_status: "forecasted",
        })}
      />,
    );

    expect(screen.getByText("Forecasted")).toBeInTheDocument();
  });
});
