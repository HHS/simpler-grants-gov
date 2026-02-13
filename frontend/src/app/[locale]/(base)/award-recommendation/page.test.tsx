import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { identity } from "lodash";
import AwardRecommendationPage from "src/app/[locale]/(base)/award-recommendation/page";
import { mockMessages, useTranslationsMock } from "src/utils/testing/intlMocks";

import * as nextNavigation from "next/navigation";

let featureFlagEnabled = false;

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  use: jest.fn(() => ({
    locale: "en",
  })),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
  setRequestLocale: identity,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
  useMessages: () => mockMessages,
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

jest.mock("src/constants/environments", () => ({
  environment: {
    NEXT_BUILD: "false",
  },
}));

jest.mock("src/services/featureFlags/FeatureFlagManager", () => {
  class FakeFeatureFlagManager {
    isFeatureEnabled() {
      return featureFlagEnabled;
    }
  }

  return {
    featureFlagsManager: new FakeFeatureFlagManager(),
  };
});

describe("AwardRecommendationPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    featureFlagEnabled = false;
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("when awardRecommendationOn feature flag is disabled", () => {
    it("should redirect to maintenance", async () => {
      featureFlagEnabled = false;

      try {
        await AwardRecommendationPage({
          params: Promise.resolve({ locale: "en" }),
          searchParams: Promise.resolve({}),
        });
      } catch (error) {
        // redirect throws an error, which is expected
      }

      expect(nextNavigation.redirect).toHaveBeenCalledWith("/maintenance");
    });
  });

  describe("when awardRecommendationOn feature flag is enabled", () => {
    beforeEach(() => {
      featureFlagEnabled = true;
    });

    it("renders the page title", async () => {
      const component = await AwardRecommendationPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({}),
      });

      render(component);
      const title = screen.getByRole("heading", { level: 1 });
      expect(title).toBeInTheDocument();
    });

    it("renders a description paragraph", async () => {
      const component = await AwardRecommendationPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({}),
      });

      render(component);
      const description = screen.getByText(
        /Award Recommendation flow coming soon/i,
      );
      expect(description).toBeInTheDocument();
    });

    it("passes accessibility scan", async () => {
      const component = await AwardRecommendationPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({}),
      });

      const { container } = render(component);
      const results = await waitFor(() => axe(container));
      expect(results).toHaveNoViolations();
    });
  });
});
