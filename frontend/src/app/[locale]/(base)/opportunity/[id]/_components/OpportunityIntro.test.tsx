import { render, screen } from "@testing-library/react";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import OpportunityIntro from "./OpportunityIntro";

// agency, assistance listings, and last updated date are tested in OpportunityHeaderDetails

const mockOpportunityData = {
  opportunity_id: "63588df8-f2d1-44ed-a201-5804abba696a",
  legacy_opportunity_id: 1,
} as OpportunityDetail;

describe("OpportunityIntro", () => {
  it("includes `Version History` link to legacy opportunity page", () => {
    render(<OpportunityIntro opportunityData={mockOpportunityData} />);

    const versionHistoryLink = screen.getByRole("link", {
      name: "versionHistory",
    });
    expect(versionHistoryLink).toBeInTheDocument();
    expect(versionHistoryLink).toHaveAttribute(
      "href",
      "https://www.grants.gov/search-results-detail/1",
    );
  });
});
