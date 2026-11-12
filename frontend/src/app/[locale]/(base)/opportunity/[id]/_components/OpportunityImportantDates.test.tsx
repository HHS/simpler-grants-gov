import { render, screen } from "@testing-library/react";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import OpportunityImportantDates from "./OpportunityImportantDates";

jest.mock("./ForecastOpportunityItem", () => ({
  ForecastOpportunityItem: () => <div data-testid="forecast-item" />,
}));
jest.mock("./PostedOpportunityItem", () => ({
  PostedOpportunityItem: ({ detail }: { detail: OpportunityDetail }) => (
    <div
      data-testid="posted-item"
      data-close-date={String(detail.summary.close_date)}
    />
  ),
}));
jest.mock("./ClosedOpportunityItem", () => ({
  ClosedOpportunityItem: () => <div data-testid="closed-item" />,
}));
jest.mock("./ArchivedOpportunityItem", () => ({
  ArchivedOpportunityItem: () => <div data-testid="archived-item" />,
}));

// note that next-intl is mocked globally, translations render as their keys

const renderDates = (
  status: OpportunityDetail["opportunity_status"],
  isForecast = false,
) =>
  render(
    <OpportunityImportantDates
      detail={
        {
          opportunity_status: status,
          summary: { is_forecast: isForecast },
        } as OpportunityDetail
      }
    />,
  );

describe("OpportunityImportantDates", () => {
  it("renders the section heading", () => {
    renderDates("posted");

    expect(
      screen.getByRole("heading", { level: 2, name: "title" }),
    ).toBeInTheDocument();
  });

  it.each([
    ["posted", "posted-item"],
    ["closed", "closed-item"],
    ["archived", "archived-item"],
  ] as const)(
    "renders the matching item for a %s opportunity",
    (status, testId) => {
      renderDates(status);

      expect(screen.getByTestId(testId)).toBeInTheDocument();
      expect(screen.queryByTestId("forecast-item")).not.toBeInTheDocument();
    },
  );

  it.each([
    ["has a summary", { close_date: "2025-03-01" }],
    ["has no summary", null],
  ])(
    "falls back to the posted item with no close date when the opportunity has no status and %s",
    (_, summary) => {
      render(
        <OpportunityImportantDates
          detail={
            {
              opportunity_status: null,
              summary,
            } as unknown as OpportunityDetail
          }
        />,
      );

      expect(
        screen.getByRole("heading", { level: 2, name: "title" }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("posted-item")).toHaveAttribute(
        "data-close-date",
        "null",
      );
      expect(screen.queryByTestId("forecast-item")).not.toBeInTheDocument();
      expect(screen.queryByTestId("closed-item")).not.toBeInTheDocument();
      expect(screen.queryByTestId("archived-item")).not.toBeInTheDocument();
    },
  );

  it("renders the forecast item for a forecasted opportunity", () => {
    renderDates("forecasted");

    expect(screen.getByTestId("forecast-item")).toBeInTheDocument();
    expect(screen.queryByTestId("posted-item")).not.toBeInTheDocument();
  });

  it("does not render the forecast item for a closed opportunity even if the summary is flagged as a forecast", () => {
    renderDates("closed", true);

    expect(screen.getByTestId("closed-item")).toBeInTheDocument();
    expect(screen.queryByTestId("forecast-item")).not.toBeInTheDocument();
  });
});
