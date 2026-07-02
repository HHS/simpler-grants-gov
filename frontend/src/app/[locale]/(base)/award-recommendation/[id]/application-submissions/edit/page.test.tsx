import { render, screen } from "@testing-library/react";
import { identity } from "lodash";
import EditRecommendationsPage, {
  dynamic,
  generateMetadata,
} from "src/app/[locale]/(base)/award-recommendation/[id]/application-submissions/edit/page";
import { AwardRecommendationDetails } from "src/types/awardRecommendationTypes";
import { LocalizedPageProps } from "src/types/intl";
import { FeatureFlaggedPageWrapper } from "src/types/uiTypes";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";
import { mockAwardRecommendationDetails } from "src/utils/testing/fixtures";

import { FunctionComponent, ReactNode } from "react";

type onEnabled = (props: LocalizedPageProps) => ReactNode;

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
}));

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
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
  })),
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

jest.mock(
  "src/components/award-recommendation/AwardRecommendationHero",
  () => ({
    __esModule: true,
    default: ({
      heading,
      showDateAndStatus,
      additionalBreadcrumbs,
    }: {
      heading: string;
      showDateAndStatus: boolean;
      additionalBreadcrumbs: Array<{ title: string; path: string }>;
    }) => (
      <div data-testid="award-recommendation-hero">
        <div data-testid="hero-heading">{heading}</div>
        <div data-testid="hero-show-date-status">
          {showDateAndStatus.toString()}
        </div>
        {additionalBreadcrumbs.map((crumb, idx) => (
          <div key={idx} data-testid={`breadcrumb-${idx}`}>
            {crumb.title} - {crumb.path}
          </div>
        ))}
      </div>
    ),
  }),
);

const mockGetAwardRecommendationDetails = jest
  .fn()
  .mockResolvedValue(mockAwardRecommendationDetails);

jest.mock("src/services/fetch/fetchers/awardRecommendationFetcher", () => ({
  getAwardRecommendationDetails: (
    id: string,
  ): Promise<AwardRecommendationDetails> =>
    mockGetAwardRecommendationDetails(
      id,
    ) as Promise<AwardRecommendationDetails>,
}));

jest.mock("src/services/auth/session", () => ({
  getSession: jest.fn().mockResolvedValue(null),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: jest.fn(() => ({
    clientFetch: jest.fn().mockResolvedValue({
      data: [],
      pagination_info: { total_pages: 1, total_records: 0 },
    }),
  })),
}));

jest.mock("src/hooks/useSelectedSubmissions", () => ({
  useSelectedSubmissions: jest.fn(() => ({
    selectedSubmissionIds: new Set(),
    selectedSubmissions: [],
    hasSelections: false,
    addSubmission: jest.fn(),
    addMultipleSubmissions: jest.fn(),
    removeSubmission: jest.fn(),
    setSelectedSubmissionIds: jest.fn(),
    clearSelections: jest.fn(),
  })),
}));

const editRecommendationsParams = Promise.resolve({
  locale: "en",
  id: "AR-26-0001",
});

describe("EditRecommendationsPage", () => {
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
          (props: { params: Promise<{ locale: string; id: string }> }) =>
            WrappedComponent(props) as unknown,
      );

      mockGetAwardRecommendationDetails.mockResolvedValue(
        mockAwardRecommendationDetails,
      );
    });

    it("renders the AwardRecommendationHero component with correct props", async () => {
      const component = await EditRecommendationsPage({
        params: editRecommendationsParams,
      });
      render(component);

      expect(
        screen.getByTestId("award-recommendation-hero"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("hero-heading")).toHaveTextContent("heading");
      expect(screen.getByTestId("hero-show-date-status")).toHaveTextContent(
        "false",
      );
    });

    it("renders the hero with correct breadcrumb configuration", async () => {
      const component = await EditRecommendationsPage({
        params: editRecommendationsParams,
      });
      render(component);

      const breadcrumb = screen.getByTestId("breadcrumb-0");
      expect(breadcrumb).toHaveTextContent("heading");
      expect(breadcrumb).toHaveTextContent(
        "/award-recommendation/AR-26-0001/application-submissions/edit",
      );
    });

    it("uses correct award recommendation ID from params", async () => {
      const customParams = Promise.resolve({
        locale: "en",
        id: "AR-26-9999",
      });

      const component = await EditRecommendationsPage({
        params: customParams,
      });
      render(component);

      const breadcrumb = screen.getByTestId("breadcrumb-0");
      expect(breadcrumb).toHaveTextContent(
        "/award-recommendation/AR-26-9999/application-submissions/edit",
      );
    });

    it("calls getAwardRecommendationDetails with expected id", async () => {
      mockGetAwardRecommendationDetails.mockResolvedValue(
        mockAwardRecommendationDetails,
      );

      await EditRecommendationsPage({
        params: editRecommendationsParams,
      });

      expect(mockGetAwardRecommendationDetails).toHaveBeenCalledWith(
        "AR-26-0001",
      );
    });

    it("renders the page heading and description", async () => {
      const component = await EditRecommendationsPage({
        params: editRecommendationsParams,
      });
      render(component);

      expect(screen.getByText("pageHeading")).toBeInTheDocument();
      expect(screen.getByText("pageDescription")).toBeInTheDocument();
    });

    it("renders the page with table container", async () => {
      const component = await EditRecommendationsPage({
        params: editRecommendationsParams,
      });
      render(component);

      expect(screen.getByText("loading")).toBeInTheDocument();
    });

    it("handles 404 error gracefully when award recommendation not found", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const notFoundError = new Error("Not found");
      notFoundError.cause = { status: 404 };
      mockGetAwardRecommendationDetails.mockRejectedValue(notFoundError);

      const component = await EditRecommendationsPage({
        params: editRecommendationsParams,
      });
      render(component);

      expect(consoleSpy).toHaveBeenCalled();
      expect(
        screen.getByText("errorHeadingAwardRecommendation"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("awardRecommendationNotFound"),
      ).toBeInTheDocument();
      consoleSpy.mockRestore();
    });

    it("handles generic error when fetching award recommendation fails", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      mockGetAwardRecommendationDetails.mockRejectedValue(
        new Error("Network error"),
      );

      const component = await EditRecommendationsPage({
        params: editRecommendationsParams,
      });

      render(component);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to fetch award recommendation details",
        expect.any(Error),
      );

      expect(
        screen.getByText("errorHeadingAwardRecommendation"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("awardRecommendationFetchError"),
      ).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it("handles authentication errors", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const authError = new Error("Unauthorized");
      authError.cause = { status: 401 };
      mockGetAwardRecommendationDetails.mockRejectedValue(authError);

      const component = await EditRecommendationsPage({
        params: editRecommendationsParams,
      });
      render(component);

      expect(
        screen.getByText("errorHeadingAuthentication"),
      ).toBeInTheDocument();
      expect(screen.getByText("authenticationError")).toBeInTheDocument();
      consoleSpy.mockRestore();
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
          (props: { params: Promise<{ locale: string; id: string }> }) =>
            onEnabled(props) as unknown,
      );
    });

    it("redirects to /maintenance when feature flag is off", async () => {
      await wrapForExpectedError(() => {
        return EditRecommendationsPage({
          params: editRecommendationsParams,
        });
      });

      expect(mockRedirect).toHaveBeenCalledWith("/maintenance");
    });

    it("uses correct feature flag name", async () => {
      await wrapForExpectedError(() => {
        return EditRecommendationsPage({
          params: editRecommendationsParams,
        });
      });

      expect(withFeatureFlagMock).toHaveBeenCalledWith(
        expect.any(Function),
        "awardRecommendationOff",
        expect.any(Function),
      );
    });
  });

  describe("generateMetadata", () => {
    it("generates correct metadata for the page", async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale: "en", id: "AR-26-0001" }),
      });

      expect(metadata).toEqual({
        title: "AwardRecommendation.editRecommendations.pageTitle",
        description: "AwardRecommendation.editRecommendations.metaDescription",
      });
    });

    it("generates metadata with different locale", async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale: "es", id: "AR-26-0001" }),
      });

      expect(metadata).toBeDefined();
      expect(metadata.title).toBeDefined();
      expect(metadata.description).toBeDefined();
    });
  });

  describe("dynamic export", () => {
    it("exports dynamic as force-dynamic", () => {
      expect(dynamic).toBe("force-dynamic");
    });
  });
});
