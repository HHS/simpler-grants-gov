import { render, screen } from "@testing-library/react";
import { fakeOpportunityDocument } from "src/utils/testing/fixtures";

import OpportunityDownload from "src/components/opportunity/OpportunityDownload";

describe("OpportunityDownload Component", () => {
  it("renders link if at least one attachment is present", () => {
    render(<OpportunityDownload attachments={[fakeOpportunityDocument]} />);
    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "#opportunity-documents");
  });

  it("does not render link if no attachments are present", () => {
    render(<OpportunityDownload attachments={[]} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
