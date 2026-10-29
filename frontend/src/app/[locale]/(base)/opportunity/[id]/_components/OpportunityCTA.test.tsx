import { fireEvent, render, screen } from "@testing-library/react";

import OpportunityCTA, { OpportunityContentBox } from "./OpportunityCTA";

describe("OpportunityCTA", () => {
  it("renders the expected content and title", () => {
    render(<OpportunityCTA legacyId={1} />);

    expect(screen.getByText("applyTitle")).toBeInTheDocument();
    expect(screen.getByText("applyContent")).toBeInTheDocument();
  });

  it("renders a link that links out to the opportunity detail on grants.gov", () => {
    render(<OpportunityCTA legacyId={1} />);

    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "https://test.grants.gov/search-results-detail/1",
    );
  });

  it("sends a user event beacon when the link is clicked", async () => {
    const sendBeaconMock = jest.fn();
    Object.defineProperty(navigator, "sendBeacon", {
      value: sendBeaconMock,
      writable: true,
    });

    render(<OpportunityCTA legacyId={1} />);

    fireEvent.click(screen.getByRole("link"));

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
      name: "click_legacy_opportunity_link",
      properties: {
        legacyOpportunityURL: "https://test.grants.gov/search-results-detail/1",
        legacyOpportunityId: 1,
      },
    });
  });
});

describe("OpportunityContentBox", () => {
  it("displays title if one is provided", () => {
    render(<OpportunityContentBox title="fun title" content="fun content" />);
    expect(screen.getByText("fun title")).toBeInTheDocument();
  });
  it("does not displays title if one is not provided", () => {
    render(<OpportunityContentBox content="fun content" />);
    expect(screen.getAllByRole("paragraph")).toHaveLength(1);
  });
  it("displays content as string or React children", () => {
    const { rerender } = render(
      <OpportunityContentBox title="fun title" content="fun content" />,
    );
    expect(screen.getByText("fun content")).toBeInTheDocument();

    rerender(
      <OpportunityContentBox
        title="fun title"
        content={
          <>
            <span>Some Stuff</span>
            <button>A button</button>
          </>
        }
      />,
    );

    expect(screen.getByText("Some Stuff")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
