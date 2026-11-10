import { render, screen } from "@testing-library/react";

import OpportunityIntro from "./OpportunityIntro";

// agency, assistance listings, and last updated date are tested in OpportunityHeaderDetails

describe("OpportunityIntro", () => {
  it("includes `Version History` link to legacy opportunity page", () => {
    render(<OpportunityIntro legacyOpportunityId={1} />);

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
