import { render, screen } from "@testing-library/react";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";
import { mockOpportunityDetail } from "src/utils/testing/fixtures";

import OpportunityImportantDates from "./OpportunityImportantDates";

const renderDates = (
  status: OpportunityDetail["opportunity_status"] | null,
  summary: Partial<OpportunityDetail["summary"]> = {},
) =>
  render(
    <OpportunityImportantDates
      opportunityData={{
        opportunity_status: status as OpportunityDetail["opportunity_status"],
        summary: { ...mockOpportunityDetail.summary, ...summary },
      }}
    />,
  );

// detail items render as "<strong>label:</strong> value" in a single paragraph
const detailItem = (label: string) =>
  // eslint-disable-next-line testing-library/no-node-access
  screen.getByText(`${label}:`).closest("p");

describe("OpportunityImportantDates", () => {
  it("renders the section heading", () => {
    renderDates("posted");
    expect(
      screen.getByRole("heading", { level: 2, name: "title" }),
    ).toBeInTheDocument();
  });

  describe("posted", () => {
    it("shows the closing date and its description without a label", () => {
      renderDates("posted", {
        close_date: "2026-08-17",
        close_date_description: "Applications close at 5pm",
      });

      expect(detailItem("closing")).toHaveTextContent("August 17, 2026");
      expect(screen.getByText("Applications close at 5pm")).toBeInTheDocument();
      expect(screen.queryByText("closed:")).not.toBeInTheDocument();
      expect(screen.queryByText("archived:")).not.toBeInTheDocument();
    });

    it("links to the eligibility information when there is no close date", () => {
      renderDates("posted", {
        close_date: null,
        close_date_description: "Rolling deadline",
      });

      expect(detailItem("closing")).toHaveTextContent("notAvailable");
      expect(
        screen.getByRole("link", { name: "seeAdditionalEligibilityInfo" }),
      ).toHaveAttribute("href", "#opportunity-additional-eligibility-info");
      expect(screen.queryByText("Rolling deadline")).not.toBeInTheDocument();
    });

    it("shows only the fallback when there is no close date or description", () => {
      renderDates("posted", { close_date: null, close_date_description: null });

      expect(detailItem("closing")).toHaveTextContent("notAvailable");
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  it("uses the closing behavior when there is no status", () => {
    renderDates(null, { close_date: "2026-08-17" });
    expect(detailItem("closing")).toHaveTextContent("August 17, 2026");
  });

  it("labels the close date as closed and shows no other dates for closed opportunities", () => {
    renderDates("closed", {
      close_date: "2026-08-17",
      archive_date: "2027-02-17",
      forecasted_award_date: "2026-01-01",
    });

    expect(detailItem("closed")).toHaveTextContent("August 17, 2026");
    expect(screen.queryByText("closing:")).not.toBeInTheDocument();
    expect(screen.queryByText("archived:")).not.toBeInTheDocument();
    expect(screen.queryByText("forecastedAwardDate:")).not.toBeInTheDocument();
  });

  it("keeps the close date for archived opportunities", () => {
    renderDates("archived", {
      close_date: "2026-08-17",
      archive_date: "2027-02-17",
    });

    expect(detailItem("archived")).toHaveTextContent("February 17, 2027");
    expect(detailItem("closed")).toHaveTextContent("August 17, 2026");
  });

  describe("forecasted", () => {
    it("shows the forecasted dates and fiscal year without a close date", () => {
      renderDates("forecasted", {
        close_date: "2026-08-17",
        forecasted_post_date: "2026-08-17",
        forecasted_close_date: "2026-10-01",
        forecasted_close_date_description: "Forecast due date note",
        forecasted_award_date: "2028-07-01",
        forecasted_project_start_date: "2028-09-01",
        fiscal_year: 2027,
      });

      expect(detailItem("forecastedPostDate")).toHaveTextContent(
        "August 17, 2026",
      );
      expect(detailItem("forecastedCloseDate")).toHaveTextContent(
        "October 1, 2026",
      );
      expect(detailItem("forecastedAwardDate")).toHaveTextContent(
        "July 1, 2028",
      );
      expect(detailItem("forecastedProjectStartDate")).toHaveTextContent(
        "September 1, 2028",
      );
      expect(detailItem("fiscalYear")).toHaveTextContent("2027");
      expect(screen.queryByText("closing:")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Forecast due date note"),
      ).not.toBeInTheDocument();
    });

    it("shows not available for missing forecast values", () => {
      renderDates("forecasted");

      [
        "forecastedPostDate",
        "forecastedCloseDate",
        "forecastedAwardDate",
        "forecastedProjectStartDate",
        "fiscalYear",
      ].forEach((label) => {
        expect(detailItem(label)).toHaveTextContent("notAvailable");
      });
    });
  });
});
