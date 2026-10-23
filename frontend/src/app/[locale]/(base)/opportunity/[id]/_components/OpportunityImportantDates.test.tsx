import { render, screen } from "@testing-library/react";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import OpportunityImportantDates from "./OpportunityImportantDates";

jest.mock("./ForecastOpportunityItem", () => ({
  ForecastOpportunityItem: () => <div data-testid="forecast-item" />,
}));
jest.mock("./PostedOpportunityItem", () => ({
  PostedOpportunityItem: () => <div data-testid="posted-item" />,
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

  it("renders the forecast item for a forecast summary", () => {
    renderDates("forecasted", true);

    expect(screen.getByTestId("forecast-item")).toBeInTheDocument();
    expect(screen.queryByTestId("posted-item")).not.toBeInTheDocument();
  });
});
