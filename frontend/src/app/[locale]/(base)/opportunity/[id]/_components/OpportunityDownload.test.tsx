import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeOpportunityDocument } from "src/utils/testing/fixtures";

import OpportunityDownload from "./OpportunityDownload";

const opportunityId = "63588df8-f2d1-44ed-a201-5804abba696a";

describe("OpportunityDownload Component", () => {
  it("renders link if at least one attachment is present", () => {
    render(
      <OpportunityDownload
        attachments={[fakeOpportunityDocument]}
        opportunityId={opportunityId}
      />,
    );
    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "#opportunity-documents");
  });

  it("has a single tab stop that lands on the link", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">before</button>
        <OpportunityDownload
          attachments={[fakeOpportunityDocument]}
          opportunityId={opportunityId}
        />
        <button type="button">after</button>
      </>,
    );

    await user.tab();
    expect(screen.getByRole("button", { name: "before" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("link", { name: "jumpToDocuments" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
  });

  it("sends a user event beacon when the link is clicked", async () => {
    const sendBeaconMock = jest.fn();
    Object.defineProperty(navigator, "sendBeacon", {
      value: sendBeaconMock,
      writable: true,
    });

    render(
      <OpportunityDownload
        attachments={[fakeOpportunityDocument]}
        opportunityId={opportunityId}
      />,
    );
    await userEvent.click(screen.getByRole("link"));

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
      name: "opportunity_click_jump_to_documents",
      properties: { opportunityId },
    });
  });

  it("does not send a user event when the link is not rendered", () => {
    const sendBeaconMock = jest.fn();
    Object.defineProperty(navigator, "sendBeacon", {
      value: sendBeaconMock,
      writable: true,
    });

    render(
      <OpportunityDownload attachments={[]} opportunityId={opportunityId} />,
    );

    expect(sendBeaconMock).not.toHaveBeenCalled();
  });

  it("does not render link if no attachments are present", () => {
    render(
      <OpportunityDownload attachments={[]} opportunityId={opportunityId} />,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
