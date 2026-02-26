import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import OpportunitiesListPage from "src/app/[locale]/(base)/opportunities/page";
import { UnauthorizedError } from "src/errors";
import { UserAgency } from "src/services/fetch/fetchers/userAgenciesFetcher";
import { LocalizedPageProps } from "src/types/intl";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { FeatureFlaggedPageWrapper } from "src/types/uiTypes";
import { DeepPartial } from "src/utils/testing/commonTestUtils";
import { localeParams, useTranslationsMock } from "src/utils/testing/intlMocks";

import { FunctionComponent, ReactNode } from "react";

type onEnabled = (props: LocalizedPageProps) => ReactNode;

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  use: jest.fn(() => ({
    locale: "en",
  })),
}));

const withFeatureFlagMock = jest
  .fn()
  .mockImplementation(
    (
      WrappedComponent: FunctionComponent<LocalizedPageProps>,
      _featureFlagName,
      _onEnabled,
    ) =>
      (props: { params: Promise<{ locale: string }> }) =>
        WrappedComponent(props) as unknown,
  );

jest.mock("src/services/featureFlags/withFeatureFlag", () => ({
  __esModule: true,
  default:
    (
      WrappedComponent: FunctionComponent<LocalizedPageProps>,
      featureFlagName: string,
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
        featureFlagName,
        onEnabled,
      )(props) as FunctionComponent<LocalizedPageProps>,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

const redirectMock = jest.fn();

jest.mock("next/navigation", () => ({
  redirect: (location: string) => redirectMock(location) as unknown,
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("src/components/workspace/AgencySelector", () => ({
  AgencySelector: ({ agencies }: { agencies: UserAgency[] }) => (
    <div>
      <label htmlFor="agency-selector-mock">Select Agency</label>
      <select id="agency-selector-mock" data-testid="agency-selector">
        {agencies.map((a) => (
          <option key={a.agency_id} value={a.agency_id}>
            {a.agency_name}
          </option>
        ))}
      </select>
    </div>
  ),
}));

const mockSearchForOpportunities = jest.fn().mockResolvedValue({ data: [] });
const mockFetchUserAgencies = jest.fn().mockResolvedValue([]);

jest.mock("src/services/fetch/fetchers/searchFetcher", () => ({
  searchForOpportunities: () =>
    mockSearchForOpportunities() as Promise<{ data: BaseOpportunity[] }>,
}));

jest.mock("src/services/fetch/fetchers/userAgenciesFetcher", () => ({
  fetchUserAgencies: () => mockFetchUserAgencies() as Promise<UserAgency[]>,
}));

const agency1: UserAgency = {
  agency_id: "agency-uuid-1",
  agency_name: "Agency One",
  agency_code: "AGY1",
};

const agency2: UserAgency = {
  agency_id: "agency-uuid-2",
  agency_name: "Agency Two",
  agency_code: "AGY2",
};

const basicOpportunity: DeepPartial<BaseOpportunity> = {
  agency_code: "AGY1",
  agency_name: "Agency One",
  opportunity_id: "89a44d32-0d90-4514-85a9-d5491f1c454d",
  opportunity_status: "posted",
  opportunity_title: "Test Opportunity",
};

describe("Opportunities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    withFeatureFlagMock.mockImplementation(
      (
        WrappedComponent: FunctionComponent<LocalizedPageProps>,
        _featureFlagName: "",
        _onEnabled: () => void,
      ) =>
        (props: { params: Promise<{ locale: string }> }) =>
          WrappedComponent(props) as unknown,
    );
  });

  describe("user has no agencies", () => {
    beforeEach(() => {
      mockFetchUserAgencies.mockResolvedValue([]);
    });

    it("renders no agencies message", async () => {
      const component = await OpportunitiesListPage({ params: localeParams });
      render(component);

      expect(await screen.findByTestId("alert")).toBeVisible();
    });

    it("passes accessibility scan", async () => {
      const component = await OpportunitiesListPage({ params: localeParams });
      const { container } = render(component);
      const results = await waitFor(() => axe(container));

      expect(results).toHaveNoViolations();
    });
  });

  describe("no agency param in URL", () => {
    beforeEach(() => {
      mockFetchUserAgencies.mockResolvedValue([agency1]);
    });

    it("redirects to first agency", async () => {
      await OpportunitiesListPage({ params: localeParams });

      expect(redirectMock).toHaveBeenCalledWith(`?agency=${agency1.agency_id}`);
    });
  });

  describe("agency param is not in user's agencies", () => {
    beforeEach(() => {
      mockFetchUserAgencies.mockResolvedValue([agency1]);
    });

    it("renders not authorized message", async () => {
      const component = await OpportunitiesListPage({
        params: localeParams,
        searchParams: Promise.resolve({ agency: "unknown-agency-uuid" }),
      });
      render(component);

      expect(await screen.findByTestId("alert")).toBeVisible();
    });
  });

  describe("single agency user", () => {
    beforeEach(() => {
      mockFetchUserAgencies.mockResolvedValue([agency1]);
    });

    it("does not render agency selector", async () => {
      mockSearchForOpportunities.mockResolvedValue({
        data: [basicOpportunity],
      });
      const component = await OpportunitiesListPage({
        params: localeParams,
        searchParams: Promise.resolve({ agency: agency1.agency_id }),
      });
      render(component);

      expect(screen.queryByTestId("agency-selector")).not.toBeInTheDocument();
    });

    it("renders opportunities filtered by agency", async () => {
      mockSearchForOpportunities.mockResolvedValue({
        data: [basicOpportunity],
      });
      const component = await OpportunitiesListPage({
        params: localeParams,
        searchParams: Promise.resolve({ agency: agency1.agency_id }),
      });
      render(component);

      expect(await screen.findByText("Test Opportunity")).toBeVisible();
    });

    it("renders no opportunities message when list is empty", async () => {
      mockSearchForOpportunities.mockResolvedValue({ data: [] });
      const component = await OpportunitiesListPage({
        params: localeParams,
        searchParams: Promise.resolve({ agency: agency1.agency_id }),
      });
      render(component);

      expect(await screen.findByText("primary")).toBeVisible();
    });

    it("passes accessibility scan", async () => {
      mockSearchForOpportunities.mockResolvedValue({
        data: [basicOpportunity],
      });
      const component = await OpportunitiesListPage({
        params: localeParams,
        searchParams: Promise.resolve({ agency: agency1.agency_id }),
      });
      const { container } = render(component);
      const results = await waitFor(() => axe(container));

      expect(results).toHaveNoViolations();
    });
  });

  describe("multi-agency user", () => {
    beforeEach(() => {
      mockFetchUserAgencies.mockResolvedValue([agency1, agency2]);
      mockSearchForOpportunities.mockResolvedValue({ data: [] });
    });

    it("renders agency selector dropdown", async () => {
      const component = await OpportunitiesListPage({
        params: localeParams,
        searchParams: Promise.resolve({ agency: agency1.agency_id }),
      });
      render(component);

      expect(await screen.findByTestId("agency-selector")).toBeVisible();
    });

    it("passes accessibility scan", async () => {
      const component = await OpportunitiesListPage({
        params: localeParams,
        searchParams: Promise.resolve({ agency: agency1.agency_id }),
      });
      const { container } = render(component);
      const results = await waitFor(() => axe(container));

      expect(results).toHaveNoViolations();
    });
  });

  describe("error fetching agencies", () => {
    it("renders error alert for general errors", async () => {
      mockFetchUserAgencies.mockRejectedValue(new Error("network failure"));
      const component = await OpportunitiesListPage({ params: localeParams });
      render(component);

      expect(await screen.findByTestId("alert")).toBeVisible();
    });

    it("unauthorized errors propagate up the stack", async () => {
      mockFetchUserAgencies.mockRejectedValue(
        new UnauthorizedError("No active session"),
      );
      await expect(
        OpportunitiesListPage({ params: localeParams }),
      ).rejects.toThrow();
    });
  });

  describe("error fetching opportunities", () => {
    beforeEach(() => {
      mockFetchUserAgencies.mockResolvedValue([agency1]);
    });

    it("renders error alert for general errors", async () => {
      mockSearchForOpportunities.mockRejectedValue(new Error("failure"));
      const component = await OpportunitiesListPage({
        params: localeParams,
        searchParams: Promise.resolve({ agency: agency1.agency_id }),
      });
      render(component);

      expect(await screen.findByTestId("alert")).toBeVisible();
    });

    it("unauthorized errors propagate up the stack", async () => {
      mockSearchForOpportunities.mockRejectedValue(
        new UnauthorizedError("No active session"),
      );
      await expect(
        OpportunitiesListPage({
          params: localeParams,
          searchParams: Promise.resolve({ agency: agency1.agency_id }),
        }),
      ).rejects.toThrow();
    });
  });
});
