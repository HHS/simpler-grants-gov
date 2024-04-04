import {
  Opportunity,
  Summary,
} from "../../../src/types/search/searchResponseTypes";
import { render, screen } from "@testing-library/react";

import React from "react";
import SearchResultsListItem from "../../../src/components/search/SearchResultsListItem";
import { axe } from "jest-axe";

// Step 2: Mock Data
const mockOpportunity: Opportunity = {
  opportunity_id: 12345,
  opportunity_title: "Test Opportunity",
  opportunity_status: "posted",
  summary: {
    archive_date: "2023-01-01",
    close_date: "2023-02-01",
    post_date: "2023-01-15",
    agency_name: "Test Agency",
    award_ceiling: 50000,
    award_floor: 10000,
  },
  opportunity_number: "OPP-12345",
} as Opportunity;

describe("SearchResultsListItem", () => {
  it("should not have basic accessibility issues", async () => {
    const { container } = render(
      <SearchResultsListItem opportunity={mockOpportunity} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders opportunity title and number", () => {
    render(<SearchResultsListItem opportunity={mockOpportunity} />);
    expect(screen.getByText("Test Opportunity")).toBeInTheDocument();
    expect(screen.getByText("OPP-12345")).toBeInTheDocument();
  });
});
