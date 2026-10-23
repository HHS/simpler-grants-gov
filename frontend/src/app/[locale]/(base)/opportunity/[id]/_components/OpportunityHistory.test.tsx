import { render, screen } from "@testing-library/react";
import { Summary } from "src/types/opportunity/opportunityResponseTypes";
import { formatDate } from "src/utils/dateUtil";

import OpportunityHistory from "./OpportunityHistory";

// Mock the formatDate function
jest.mock("src/utils/dateUtil", () => ({
  formatDate: jest.fn((date: string) => date),
}));

const mockSummary = {
  post_date: "2024-01-15",
  archive_date: "2024-12-31",
  version_number: 1,
} as Summary;

describe("OpportunityHistory", () => {
  it("renders history section with dates formatted correctly", () => {
    render(
      <OpportunityHistory
        status="posted"
        summary={mockSummary}
        legacyOpportunityId={1}
      />,
    );

    expect(screen.getByText("history")).toBeInTheDocument();

    // version, posted date and archive date are list items
    expect(screen.getAllByRole("listitem")).toHaveLength(3);

    expect(screen.getByText("version:")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();

    expect(screen.getByText("postedDate:")).toBeInTheDocument();
    expect(screen.getByText("2024-01-15")).toBeInTheDocument();

    expect(screen.getByText("archiveDate:")).toBeInTheDocument();
    expect(screen.getByText("2024-12-31")).toBeInTheDocument();
  });

  it("labels the posted date as the forecast posted date for forecasted opportunities", () => {
    render(
      <OpportunityHistory
        status="forecasted"
        summary={mockSummary}
        legacyOpportunityId={1}
      />,
    );

    expect(screen.getByText("forecastPostedDate:")).toBeInTheDocument();
    expect(screen.queryByText("postedDate:")).not.toBeInTheDocument();
  });

  it.each([null, ""])(
    "hides the posted date for forecasted opportunities when it is %p",
    (postDate) => {
      render(
        <OpportunityHistory
          status="forecasted"
          summary={{ ...mockSummary, post_date: postDate }}
          legacyOpportunityId={1}
        />,
      );

      expect(screen.queryByText("forecastPostedDate:")).not.toBeInTheDocument();
      expect(screen.getByText("archiveDate:")).toBeInTheDocument();
    },
  );

  it("still shows a posted date fallback for non-forecasted opportunities", () => {
    render(
      <OpportunityHistory
        status="closed"
        summary={{ ...mockSummary, post_date: null }}
        legacyOpportunityId={1}
      />,
    );

    expect(screen.getByText("postedDate:")).toBeInTheDocument();
  });

  it("links to the version history on Grants.gov", () => {
    render(
      <OpportunityHistory
        status="posted"
        summary={mockSummary}
        legacyOpportunityId={1}
      />,
    );

    expect(
      screen.getByRole("link", { name: "versionHistory" }),
    ).toHaveAttribute("href", "https://www.grants.gov/search-results-detail/1");
  });

  it("calls formatDate for date fields", () => {
    render(
      <OpportunityHistory
        status="posted"
        summary={mockSummary}
        legacyOpportunityId={1}
      />,
    );

    // Check that formatDate is called with the right dates
    expect(formatDate).toHaveBeenCalledWith("2024-01-15");
    expect(formatDate).toHaveBeenCalledWith("2024-12-31");
  });

  it("displays correct defaults when null values are present", () => {
    render(
      <OpportunityHistory
        status="posted"
        legacyOpportunityId={1}
        summary={
          {
            post_date: null,
            archive_date: null,
            version_number: null,
          } as Summary
        }
      />,
    );

    const firstHeading = screen.getByText("history");
    // eslint-disable-next-line testing-library/no-node-access
    expect(firstHeading.nextSibling).toHaveTextContent("notSpecified");

    const secondHeading = screen.getByText("version:");
    // eslint-disable-next-line testing-library/no-node-access
    expect(secondHeading.nextElementSibling).toHaveTextContent("notSpecified");
    const thirdHeading = screen.getByText("postedDate:");
    // eslint-disable-next-line testing-library/no-node-access
    expect(thirdHeading.nextElementSibling).toHaveTextContent("notSpecified");
    const fifthHeading = screen.getByText("archiveDate:");
    // eslint-disable-next-line testing-library/no-node-access
    expect(fifthHeading.nextElementSibling).toHaveTextContent("notSpecified");
  });
});
