import { render, screen } from "@testing-library/react";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import { ForecastOpportunityItem } from "./ForecastOpportunityItem";

// note that next-intl is mocked globally, translations render as their keys
jest.mock("src/utils/dateUtil", () => ({
  formatDate: jest.fn((date: string) => date),
}));

const mockSummary = {
  forecasted_post_date: "2025-01-01",
  forecasted_close_date: "2025-03-01",
  forecasted_award_date: "2025-06-01",
  forecasted_project_start_date: "2025-07-01",
  fiscal_year: 2026,
} as OpportunityDetail["summary"];

const renderItem = (summary: Partial<OpportunityDetail["summary"]> = {}) =>
  render(
    <ForecastOpportunityItem
      detail={{ summary: { ...mockSummary, ...summary } } as OpportunityDetail}
    />,
  );

describe("ForecastOpportunityItem", () => {
  it("renders every forecasted date and the fiscal year", () => {
    renderItem();

    expect(screen.getByText("forecastedPostDate:")).toBeInTheDocument();
    expect(screen.getByText("2025-01-01")).toBeInTheDocument();
    expect(screen.getByText("forecastedCloseDate:")).toBeInTheDocument();
    expect(screen.getByText("2025-03-01")).toBeInTheDocument();
    expect(screen.getByText("forecastedAwardDate:")).toBeInTheDocument();
    expect(screen.getByText("2025-06-01")).toBeInTheDocument();
    expect(screen.getByText("forecastedProjectStartDate:")).toBeInTheDocument();
    expect(screen.getByText("2025-07-01")).toBeInTheDocument();
    expect(screen.getByText("fiscalYear:")).toBeInTheDocument();
    expect(screen.getByText("2026")).toBeInTheDocument();
  });

  it("shows not specified when dates are missing", () => {
    renderItem({
      forecasted_post_date: null,
      forecasted_award_date: null,
      forecasted_project_start_date: null,
    });

    expect(screen.getAllByText("notSpecified")).toHaveLength(3);
  });

  it.each([null, ""])(
    "shows not specified when the application due date is %p",
    (date) => {
      renderItem({ forecasted_close_date: date });

      expect(screen.getByText("notSpecified")).toBeInTheDocument();
    },
  );

  it("does not render a close date or any due date description", () => {
    renderItem({
      close_date: "2025-09-09",
      close_date_description: "Due in March",
    });

    expect(screen.queryByText("2025-09-09")).not.toBeInTheDocument();
    expect(screen.queryByText("Due in March")).not.toBeInTheDocument();
    expect(
      screen.queryByText("forecastedCloseDateDescription:"),
    ).not.toBeInTheDocument();
  });
});
