import { render, screen } from "@testing-library/react";

import FundingContent from "src/components/FundingContent";

describe("Funding Content", () => {
  it("Renders without errors", () => {
    render(<FundingContent />);
    const fundingH2 = screen.getByRole("heading", {
      level: 2,
      name: /Improvements to funding opportunity announcements?/i,
    });

    expect(fundingH2).toBeInTheDocument();
  });
});
