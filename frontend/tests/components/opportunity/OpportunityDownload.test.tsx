import { render, screen } from "@testing-library/react";
import { fakeOpportunityDocument } from "src/utils/testing/fixtures";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import OpportunityDownload from "src/components/opportunity/OpportunityDownload";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

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
