import { fireEvent, render, screen } from "@testing-library/react";

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

  it("sends a user event beacon when a document link is clicked", async () => {
    const sendBeaconMock = jest.fn();
    Object.defineProperty(navigator, "sendBeacon", {
      value: sendBeaconMock,
      writable: true,
    });

    render(
      <OpportunityDocuments
        opportunityId="63588df8-f2d1-44ed-a201-5804abba696a"
        documents={mockData}
      />,
    );

    fireEvent.click(
      screen.getByRole("link", { name: "FundingInformation.pdf" }),
    );

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    const [url, blob] = sendBeaconMock.mock.calls[0] as [string, Blob];
    expect(url).toBe("/api/events");
    const blobText = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("failed to read blob"));
      reader.readAsText(blob);
    });
    expect(JSON.parse(blobText)).toEqual({
      name: "click_download_opportunity_document",
      properties: {
        opportunityId: "63588df8-f2d1-44ed-a201-5804abba696a",
        fileName: "FundingInformation.pdf",
      },
    });
  });
});
