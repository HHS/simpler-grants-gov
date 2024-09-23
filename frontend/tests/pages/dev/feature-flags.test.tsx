/**
 * @jest-environment ./tests/utils/jsdomNodeEnvironment.ts
 */

import { fireEvent, render, screen } from "@testing-library/react";
import FeatureFlags from "src/app/[locale]/dev/feature-flags/page";
import { mockDefaultFeatureFlags } from "tests/utils/FeatureFlagTestUtils";

describe("Feature flags page", () => {
  const MOCK_DEFAULT_FEATURE_FLAGS = {
    someFakeFeature1: true,
    someFakeFeature2: true,
    someFakeFeature3: true,
  };

  beforeEach(() => {
    mockDefaultFeatureFlags(MOCK_DEFAULT_FEATURE_FLAGS);
  });

  it("should render all feature flags", () => {
    render(<FeatureFlags />);
    Object.keys(MOCK_DEFAULT_FEATURE_FLAGS).forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
      expect(screen.getByTestId(`${name}-status`)).toHaveTextContent("Enabled");
    });
  });

  it("clicking on a feature flag enable and disable buttons should update state", () => {
    render(<FeatureFlags />);
    Object.keys(MOCK_DEFAULT_FEATURE_FLAGS).forEach((name) => {
      const enableButton = screen.getByTestId(`enable-${name}`);
      const disableButton = screen.getByTestId(`disable-${name}`);
      const statusElement = screen.getByTestId(`${name}-status`);
      expect(statusElement).toHaveTextContent("Enabled");
      fireEvent.click(enableButton);
      expect(statusElement).toHaveTextContent("Enabled");
      fireEvent.click(disableButton);
      expect(statusElement).toHaveTextContent("Disabled");
      fireEvent.click(disableButton);
      expect(statusElement).toHaveTextContent("Disabled");
      fireEvent.click(enableButton);
      expect(statusElement).toHaveTextContent("Enabled");
    });
  });
});
