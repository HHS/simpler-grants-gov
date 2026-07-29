import { render, screen } from "@testing-library/react";

import MaintenanceBanner from "./MaintenanceBanner";

const checkFeatureFlagMock = jest.fn();

jest.mock("src/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({
    checkFeatureFlag: (flagName: string) =>
      checkFeatureFlagMock(flagName) as boolean,
  }),
}));

describe("MaintenanceBanner", () => {
  afterEach(() => {
    checkFeatureFlagMock.mockReset();
  });

  it("renders the message when the flag is on and a message is provided", () => {
    checkFeatureFlagMock.mockReturnValue(true);
    const message =
      "Scheduled maintenance: site will be unavailable 7–8am EST on June 10, 2026";

    render(<MaintenanceBanner message={message} />);

    expect(checkFeatureFlagMock).toHaveBeenCalledWith(
      "maintenanceBannerEnabled",
    );
    expect(screen.getByTestId("maintenance-banner")).toHaveTextContent(message);
  });

  it("renders nothing when the flag is off", () => {
    checkFeatureFlagMock.mockReturnValue(false);

    render(<MaintenanceBanner message="Scheduled maintenance window" />);

    expect(screen.queryByTestId("maintenance-banner")).not.toBeInTheDocument();
  });

  it("renders nothing when the flag is on but no message is configured", () => {
    checkFeatureFlagMock.mockReturnValue(true);

    render(<MaintenanceBanner message="" />);

    expect(screen.queryByTestId("maintenance-banner")).not.toBeInTheDocument();
  });
});
