/**
 * @jest-environment ./src/utils/testing/jsdomNodeEnvironment.ts
 */

import { fireEvent, render, screen } from "@testing-library/react";
import FeatureFlags from "src/app/[locale]/dev/feature-flags/page";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

const MOCK_DEFAULT_FEATURE_FLAGS = {
  someFakeFeature1: true,
  someFakeFeature2: true,
  someFakeFeature3: true,
};

type MockFeatureFlagKeys = keyof typeof MOCK_DEFAULT_FEATURE_FLAGS;

const mockUseFeatureFlags = jest.fn(() => ({
  featureFlags: MOCK_DEFAULT_FEATURE_FLAGS,
  setFeatureFlag: (flagName: MockFeatureFlagKeys, value: boolean) =>
    mockSetFeatureFlag(flagName, value),
}));

const mockSetFeatureFlag = jest.fn(
  (flagName: MockFeatureFlagKeys, value: boolean) => {
    MOCK_DEFAULT_FEATURE_FLAGS[flagName] = value;
  },
);

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  use: jest.fn(() => ({
    locale: "en",
  })),
}));

const mockSetQueryParam = jest.fn();

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    setQueryParam: mockSetQueryParam,
  }),
}));

jest.mock("src/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => mockUseFeatureFlags(),
}));

describe("Feature flags page", () => {
  it("should render all feature flags", () => {
    render(<FeatureFlags />);
    expect(mockUseFeatureFlags).toHaveBeenCalled();
    Object.keys(MOCK_DEFAULT_FEATURE_FLAGS).forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
      expect(screen.getByTestId(`${name}-status`)).toHaveTextContent("Enabled");
    });
  });

  it("clicking on a feature flag enable and disable buttons should update state", () => {
    const { rerender } = render(<FeatureFlags />);
    Object.keys(MOCK_DEFAULT_FEATURE_FLAGS).forEach((name) => {
      const enableButton = screen.getByTestId(`enable-${name}`);
      const disableButton = screen.getByTestId(`disable-${name}`);
      const statusElement = screen.getByTestId(`${name}-status`);

      expect(statusElement).toHaveTextContent("Enabled");
      fireEvent.click(enableButton);
      rerender(<FeatureFlags />);
      expect(statusElement).toHaveTextContent("Enabled");

      rerender(<FeatureFlags />);
      fireEvent.click(disableButton);
      rerender(<FeatureFlags />);
      expect(statusElement).toHaveTextContent("Disabled");

      fireEvent.click(disableButton);
      rerender(<FeatureFlags />);
      expect(statusElement).toHaveTextContent("Disabled");

      fireEvent.click(enableButton);
      rerender(<FeatureFlags />);
      expect(statusElement).toHaveTextContent("Enabled");
    });
  });

  it("should set feature flags to their default state when clicking reset to default button", () => {
    const { rerender } = render(<FeatureFlags />);
    Object.keys(MOCK_DEFAULT_FEATURE_FLAGS).forEach((name) => {
      const enableButton = screen.getByTestId(`enable-${name}`);
      const disableButton = screen.getByTestId(`disable-${name}`);

      if (!MOCK_DEFAULT_FEATURE_FLAGS[name as MockFeatureFlagKeys]) {
        fireEvent.click(enableButton);
      } else {
        fireEvent.click(disableButton);
      }
      rerender(<FeatureFlags />);
    });

    const defaultButton = screen.getByTestId(`reset-defaults`);
    fireEvent.click(defaultButton);

    rerender(<FeatureFlags />);
    for (const [name, defaultValue] of Object.entries(
      MOCK_DEFAULT_FEATURE_FLAGS,
    ) as [MockFeatureFlagKeys, boolean][]) {
      const statusEl = screen.getByTestId(`${name}-status`);

      const expectedText = defaultValue ? "Enabled" : "Disabled";
      expect(statusEl).toHaveTextContent(expectedText);
    }
  });
});
