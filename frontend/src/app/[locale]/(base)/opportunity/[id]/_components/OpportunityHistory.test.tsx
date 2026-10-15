import { render, screen } from "@testing-library/react";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";
import { mockOpportunityDetail } from "src/utils/testing/fixtures";

import OpportunityHistory from "./OpportunityHistory";

const renderHistory = (
  status: OpportunityDetail["opportunity_status"],
  summary: Partial<OpportunityDetail["summary"]> = {},
  legacyId: number | null = 12345,
) =>
  render(
    <OpportunityHistory
      opportunityData={{
        opportunity_status: status,
        legacy_opportunity_id: legacyId as number,
        summary: { ...mockOpportunityDetail.summary, ...summary },
      }}
    />,
  );

const detailItem = (label: string) =>
  // eslint-disable-next-line testing-library/no-node-access
  screen.getByText(`${label}:`).closest("p");

describe("OpportunityHistory", () => {
  it("renders posted, archive, version and the version history link", () => {
    renderHistory("posted", {
      post_date: "2026-08-17",
      archive_date: "2027-02-17",
      version_number: 2,
      is_forecast: false,
    });

    expect(
      screen.getByRole("heading", { level: 2, name: "title" }),
    ).toBeInTheDocument();
    expect(detailItem("postedDate")).toHaveTextContent("August 17, 2026");
    expect(detailItem("archiveDate")).toHaveTextContent("February 17, 2027");
    expect(detailItem("version")).toHaveTextContent("synopsisVersion 2");

    const link = screen.getByRole("link", { name: "versionHistory" });
    expect(link).toHaveAttribute(
      "href",
      "https://www.grants.gov/search-results-detail/12345",
    );
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("labels forecast versions", () => {
    renderHistory("forecasted", { version_number: 3, is_forecast: true });
    expect(detailItem("version")).toHaveTextContent("forecastVersion 3");
  });

  it("labels the archive date as archived for archived opportunities", () => {
    renderHistory("archived", { archive_date: "2027-02-17" });

    expect(detailItem("archivedDate")).toHaveTextContent("February 17, 2027");
    expect(screen.queryByText("archiveDate:")).not.toBeInTheDocument();
  });

  it("shows not available for missing values", () => {
    renderHistory("posted", {
      post_date: null,
      archive_date: null,
      version_number: null,
    });

    expect(detailItem("postedDate")).toHaveTextContent("notAvailable");
    expect(detailItem("archiveDate")).toHaveTextContent("notAvailable");
    expect(detailItem("version")).toHaveTextContent("notAvailable");
  });

  it("hides a missing posted date for forecasts", () => {
    renderHistory("forecasted", { post_date: null });
    expect(screen.queryByText("postedDate:")).not.toBeInTheDocument();
  });

  it("shows the posted date for forecasts when there is one", () => {
    renderHistory("forecasted", { post_date: "2026-08-17" });
    expect(detailItem("postedDate")).toHaveTextContent("August 17, 2026");
  });

  it("omits the version history link without a legacy id", () => {
    renderHistory("posted", {}, null);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
