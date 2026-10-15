import { render, screen } from "@testing-library/react";
import { Summary } from "src/types/opportunity/opportunityResponseTypes";
import { mockOpportunityDetail } from "src/utils/testing/fixtures";

import OpportunitySummary from "./OpportunitySummary";

const renderSummary = (summary: Partial<Summary> = {}) =>
  render(
    <OpportunitySummary
      summary={{ ...mockOpportunityDetail.summary, ...summary }}
    />,
  );

describe("OpportunitySummary", () => {
  it("renders the summary heading, description and jump link", () => {
    renderSummary({ summary_description: "<p>About this opportunity</p>" });

    expect(
      screen.getByRole("heading", { level: 2, name: "title" }),
    ).toBeInTheDocument();
    expect(screen.getByText("About this opportunity")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "jumpToDocuments" }),
    ).toHaveAttribute("href", "#opportunity-documents");
  });

  it("does not render a link inside a button", () => {
    renderSummary({ summary_description: "About this opportunity" });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("collapses long descriptions behind the show full description toggle", () => {
    renderSummary({ summary_description: "word ".repeat(200) });

    expect(
      screen.getByRole("button", { name: /showDescription/ }),
    ).toBeInTheDocument();
  });

  it("hides the summary but keeps the jump link when there is no description", () => {
    renderSummary({ summary_description: null });

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "jumpToDocuments" }),
    ).toBeInTheDocument();
  });
});
