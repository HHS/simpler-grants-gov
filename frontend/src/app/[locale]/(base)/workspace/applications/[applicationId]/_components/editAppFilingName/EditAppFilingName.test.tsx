import { fireEvent, render, screen } from "@testing-library/react";

import { EditAppFilingName } from "./EditAppFilingName";

// actions.ts pulls in session verification (jose), which is ESM-only and
// not needed here - this suite never submits the rename form, just clicks
// the button that opens it.
jest.mock(
  "src/app/[locale]/(base)/workspace/applications/[applicationId]/actions",
  () => ({
    updateAppFilingNameAction: jest.fn(),
  }),
);

describe("EditAppFilingName", () => {
  it("sends a user event beacon when the edit button is clicked", () => {
    const sendBeaconMock = jest.fn();
    Object.defineProperty(navigator, "sendBeacon", {
      value: sendBeaconMock,
      writable: true,
    });

    render(
      <EditAppFilingName
        applicationId="app-1"
        applicationName="My Application"
        opportunityName="An Opportunity"
      />,
    );

    fireEvent.click(screen.getByTestId("sign-in-button"));

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    const [url, blob] = sendBeaconMock.mock.calls[0] as [string, Blob];
    expect(url).toBe("/api/events");
    expect(blob.type).toBe("application/json");
  });
});
