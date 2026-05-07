import { render, screen } from "@testing-library/react";
import { identity } from "lodash";
import CreateAwardRecommendationPage from "src/app/[locale]/(base)/award-recommendation/create/page";
import { LocalizedPageProps } from "src/types/intl";
import { FeatureFlaggedPageWrapper } from "src/types/uiTypes";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

import { FunctionComponent, ReactNode } from "react";

type onEnabled = (props: LocalizedPageProps) => ReactNode;

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  use: jest.fn(() => ({
    locale: "en",
  })),
}));

const mockRedirect = jest.fn();
const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("NEXT_REDIRECT");
  },
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
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

const createAwardRecommendationParams = Promise.resolve({
  locale: "en",
});

describe("CreateAwardRecommendationPage", () => {
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

    it("renders the page title", async () => {
      const component = await CreateAwardRecommendationPage({
        params: createAwardRecommendationParams,
      });
      render(component);
      expect(await screen.findByText("pageTitle")).toBeVisible();
    });

    it("renders breadcrumbs", async () => {
      const component = await CreateAwardRecommendationPage({
        params: createAwardRecommendationParams,
      });
      render(component);

      expect(await screen.findByText("home")).toBeVisible();
      expect(await screen.findByText("Award Recommendations")).toBeVisible();
      expect(await screen.findByText("Create")).toBeVisible();
    });

    it("renders the CreateRecommendationContent component", async () => {
      const component = await CreateAwardRecommendationPage({
        params: createAwardRecommendationParams,
      });
      render(component);

      expect(await screen.findByText("beforeYouGetStarted")).toBeVisible();
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
      await wrapForExpectedError(() => {
        return CreateAwardRecommendationPage({
          params: createAwardRecommendationParams,
        });
      });

      expect(mockRedirect).toHaveBeenCalledWith("/maintenance");
    });
  });
});
