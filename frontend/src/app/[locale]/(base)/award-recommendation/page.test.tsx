import { render, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import AwardRecommendationPage from "src/app/[locale]/(base)/award-recommendation/page";
import { LocalizedPageProps } from "src/types/intl";
import { FeatureFlaggedPageWrapper } from "src/types/uiTypes";
import { localeParams, useTranslationsMock } from "src/utils/testing/intlMocks";

import React, { FunctionComponent, ReactNode } from "react";

import AwardRecommendationHero from "src/components/award-recommendation/AwardRecommendationHero";

type onEnabled = (props: LocalizedPageProps) => ReactNode;

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  use: jest.fn(() => ({
    locale: "en",
  })),
}));

const mockRedirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("NEXT_REDIRECT");
  },
}));

const withFeatureFlagMock = jest.fn();

jest.mock("src/services/featureFlags/withFeatureFlag", () => ({
  __esModule: true,
  default:
    (
      WrappedComponent: FunctionComponent<LocalizedPageProps>,
      _featureFlagName: string,
      onEnabled: onEnabled,
    ) =>
    (props: LocalizedPageProps) =>
      (
        withFeatureFlagMock as FeatureFlaggedPageWrapper<
          LocalizedPageProps,
          ReactNode
        >
      )(
        WrappedComponent,
        _featureFlagName,
        onEnabled,
      )(props) as FunctionComponent<LocalizedPageProps>,
}));

jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(() => useTranslationsMock()),
}));

describe("AwardRecommendationPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when feature flag is enabled", () => {
    beforeEach(() => {
      withFeatureFlagMock.mockImplementation(
        (
          WrappedComponent: FunctionComponent<LocalizedPageProps>,
          _featureFlagName: string,
          _onEnabled: onEnabled,
        ) =>
          (props: { params: Promise<{ locale: string }> }) =>
            WrappedComponent(props) as unknown,
      );
    });

    it("includes the AwardRecommendationHero component in the page", async () => {
      const component = (await AwardRecommendationPage({
        params: localeParams,
      })) as React.ReactElement;

      const children = React.Children.toArray(
        (component.props as { children?: React.ReactNode }).children,
      );
      const hasHero = children.some(
        (child) =>
          React.isValidElement(child) && child.type === AwardRecommendationHero,
      );

      expect(hasHero).toBe(true);
    });

    it("passes accessibility scan", async () => {
      const component = await AwardRecommendationPage({
        params: localeParams,
      });
      const { container } = render(component);
      const results = await waitFor(() => axe(container));

      expect(results).toHaveNoViolations();
    });
  });

  describe("when feature flag is disabled", () => {
    beforeEach(() => {
      withFeatureFlagMock.mockImplementation(
        (
          _WrappedComponent: FunctionComponent<LocalizedPageProps>,
          _featureFlagName: string,
          onEnabled: onEnabled,
        ) =>
          (props: { params: Promise<{ locale: string }> }) =>
            onEnabled(props) as unknown,
      );
    });

    it("redirects to /maintenance", async () => {
      try {
        await AwardRecommendationPage({
          params: localeParams,
        });
        throw new Error("Expected redirect to throw");
      } catch (error) {
        expect(mockRedirect).toHaveBeenCalledWith("/maintenance");
      }
    });
  });
});
