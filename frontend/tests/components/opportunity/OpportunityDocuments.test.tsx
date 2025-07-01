import { render, screen } from "@testing-library/react";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import OpportunityDocuments from "src/components/opportunity/OpportunityDocuments";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

const mockData = [
  {
    file_name: "FundingInformation.pdf",
    download_path: "https://example.com",
    updated_at: "2021-10-01T00:00:00Z",
  },
  {
    file_name: "File2_ExhibitB.pdf",
    download_path: "https://example.com",
    updated_at: "2021-10-01T00:00:00Z",
  },
];

describe("OpportunityDocuments", () => {
  it("renders", () => {
    render(
      <OpportunityDocuments
        opportunityId="63588df8-f2d1-44ed-a201-5804abba696a"
        documents={mockData}
      />,
    );

    const fundLink = screen.getByRole("link", {
      name: "FundingInformation.pdf",
    });
    const otherLink = screen.getByRole("link", {
      name: "File2_ExhibitB.pdf",
    });

    expect(fundLink).toBeInTheDocument();
    expect(fundLink).toHaveAttribute("href", "https://example.com");

    expect(otherLink).toBeInTheDocument();
    expect(otherLink).toHaveAttribute("href", "https://example.com");
  });
});
