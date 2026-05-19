import { render, screen } from "@testing-library/react";
import { identity } from "lodash";
import SelectOpportunityPage from "src/app/[locale]/(base)/award-recommendation/select-opportunity/page";
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

const selectOpportunityParams = Promise.resolve({
  locale: "en",
});

describe("CreateAwardRecommendationSelectOpportunityPage", () => {
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
      const component = await SelectOpportunityPage({
        params: selectOpportunityParams,
      });
      render(component);
      expect(await screen.findByText("Award Recommendations")).toBeVisible();
    });

    it("renders breadcrumbs", async () => {
      const component = await SelectOpportunityPage({
        params: selectOpportunityParams,
      });
      render(component);

      expect(await screen.findByText("home")).toBeVisible();
      expect(await screen.findByText("Award Recommendations")).toBeVisible();
      expect(await screen.findByText("Create")).toBeVisible();
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
        return SelectOpportunityPage({
          params: selectOpportunityParams,
        });
      });

      expect(mockRedirect).toHaveBeenCalledWith("/maintenance");
    });
  });
});
