import { render, screen } from "@testing-library/react";

import OpportunityDocuments from "./OpportunityDocuments";

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

  it("renders the filename as plain text, not a link, when download_path is unavailable", () => {
    render(
      <OpportunityDocuments
        opportunityId="63588df8-f2d1-44ed-a201-5804abba696a"
        documents={[
          {
            file_name: "Unavailable.pdf",
            download_path: null,
            updated_at: "2021-10-01T00:00:00Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("Unavailable.pdf")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Unavailable.pdf" }),
    ).not.toBeInTheDocument();
  });
});
