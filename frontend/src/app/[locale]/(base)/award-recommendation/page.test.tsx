import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import AwardRecommendationPage, {
  AwardRecommendationPageProps,
} from "src/app/[locale]/(base)/award-recommendation/page";
import { LocalizedPageProps } from "src/types/intl";
import { localeParams, useTranslationsMock } from "src/utils/testing/intlMocks";

import { FunctionComponent, ReactNode } from "react";

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

jest.mock("src/services/featureFlags/withFeatureFlag", () => ({
  __esModule: true,
  default:
    (
      WrappedComponent: FunctionComponent<AwardRecommendationPageProps>,
      featureFlagName: string,
      onEnabled: onEnabled,
    ) =>
    async (props: AwardRecommendationPageProps) => {
      const searchParams = props.searchParams
        ? (await props.searchParams) || {}
        : {};
      const isEnabled = searchParams[featureFlagName] === "true";

      // eslint-disable-next-line no-console
      console.log(
        `Feature flag "${featureFlagName}" is ${isEnabled ? "enabled" : "disabled"}.`,
      );
      if (isEnabled) {
        const element = onEnabled(props);
        // Resolve async server components for testing
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        if (element && typeof (element as any).type === "function") {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
          return await (element as any).type((element as any).props);
        }
        return element;
      }
      return WrappedComponent(props);
    },
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: jest
    .fn()
    .mockImplementation(
      () => (key: string, opts?: { defaultValue?: string }) =>
        opts?.defaultValue ?? key,
    ),
}));

describe("AwardRecommendationPage", () => {
  describe("when feature flag is enabled", () => {
    it("renders page title and description", async () => {
      const component = await AwardRecommendationPage({
        params: localeParams,
        searchParams: Promise.resolve({ awardRecommendationOn: "true" }),
      });
      render(component);

      // eslint-disable-next-line no-console
      console.log(component);
      expect(await screen.findByText("Award Recommendation")).toBeVisible();
      expect(
        await screen.findByText("Award Recommendation flow coming soon."),
      ).toBeVisible();
    });

    it("passes accessibility scan", async () => {
      const component = await AwardRecommendationPage({
        params: localeParams,
        searchParams: Promise.resolve({ awardRecommendationOn: "true" }),
      });
      const { container } = render(component);
      const results = await waitFor(() => axe(container));

      expect(results).toHaveNoViolations();
    });
  });

  describe("when feature flag is disabled", () => {
    it("redirects to /maintenance when flag is false", async () => {
      await expect(
        AwardRecommendationPage({
          params: localeParams,
          searchParams: Promise.resolve({ awardRecommendationOn: "false" }),
        }),
      ).rejects.toThrow("NEXT_REDIRECT");

      expect(mockRedirect).toHaveBeenCalledWith("/maintenance");
    });

    it("redirects to /maintenance when flag is missing", async () => {
      await expect(
        AwardRecommendationPage({
          params: localeParams,
          searchParams: Promise.resolve({}),
        }),
      ).rejects.toThrow("NEXT_REDIRECT");

      expect(mockRedirect).toHaveBeenCalledWith("/maintenance");
    });
  });
});
