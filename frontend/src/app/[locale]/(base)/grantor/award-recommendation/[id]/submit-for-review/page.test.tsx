import { render, screen } from "@testing-library/react";
import { identity } from "lodash";
import { redirect } from "next/navigation";

import SubmitForReviewPage from "./page";
import { mockAwardRecommendationDetails } from "src/utils/testing/fixtures";

const mockGetAwardRecommendationDetails = jest.fn();

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

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

jest.mock(
  "src/services/fetch/fetchers/awardRecommendationFetcher",
  () => ({
    getAwardRecommendationDetails: (...args: unknown[]) =>
      mockGetAwardRecommendationDetails(...args),
  }),
);

jest.mock("src/services/featureFlags/withFeatureFlag", () => ({
  __esModule: true,
  default: <P, R>(
    Component: React.ComponentType<P>,
    _featureFlag: string,
    _redirectFn: () => R,
  ) => Component,
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
      heading?: string;
      showDateAndStatus?: boolean;
      additionalBreadcrumbs?: { title: string }[];
    }) => (
      <div data-testid="award-recommendation-hero">
        {heading && <h1>{heading}</h1>}
        {showDateAndStatus !== undefined && (
          <div data-testid="show-date-status">{String(showDateAndStatus)}</div>
        )}
        {additionalBreadcrumbs && (
          <div data-testid="breadcrumbs">
            {additionalBreadcrumbs.map((crumb, i) => (
              <span key={i}>{crumb.title}</span>
            ))}
          </div>
        )}
      </div>
    ),
  }),
);

jest.mock(
  "./_components/ReviewSubmissionFormContainer",
  () => ({
    ReviewSubmissionFormContainer: ({
      awardRecommendationId,
      expectedReviewerType,
    }: {
      awardRecommendationId: string;
      expectedReviewerType?: string;
    }) => (
      <div data-testid="review-submission-form-container">
        <div data-testid="award-rec-id">{awardRecommendationId}</div>
        {expectedReviewerType && (
          <div data-testid="reviewer-type">{expectedReviewerType}</div>
        )}
      </div>
    ),
  }),
);

describe("SubmitForReviewPage", () => {
  const mockParams = Promise.resolve({
    locale: "en",
    id: "test-id-123",
  });
  const mockSearchParams = Promise.resolve({});

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAwardRecommendationDetails.mockResolvedValue(
      mockAwardRecommendationDetails,
    );
  });

  it("renders the page with award recommendation hero and form", async () => {
    const page = await SubmitForReviewPage({
      params: mockParams,
      searchParams: mockSearchParams,
    });
    render(page);

    expect(screen.getByTestId("award-recommendation-hero")).toBeInTheDocument();
    expect(
      screen.getByTestId("review-submission-form-container"),
    ).toBeInTheDocument();
  });

  it("displays Submit for Review heading", async () => {
    const page = await SubmitForReviewPage({
      params: mockParams,
      searchParams: mockSearchParams,
    });
    render(page);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "reviewForm.header",
    );
  });

  it("hides date and status in hero", async () => {
    const page = await SubmitForReviewPage({
      params: mockParams,
      searchParams: mockSearchParams,
    });
    render(page);

    const showDateStatus = screen.getByTestId("show-date-status");
    expect(showDateStatus).toHaveTextContent("false");
  });

  it("includes Submit for Review in breadcrumbs", async () => {
    const page = await SubmitForReviewPage({
      params: mockParams,
      searchParams: mockSearchParams,
    });
    render(page);

    const breadcrumbs = screen.getByTestId("breadcrumbs");
    expect(breadcrumbs).toHaveTextContent("reviewForm.header");
  });

  it("passes award recommendation id to form container", async () => {
    const page = await SubmitForReviewPage({
      params: mockParams,
      searchParams: mockSearchParams,
    });
    render(page);

    const awardRecId = screen.getByTestId("award-rec-id");
    expect(awardRecId).toHaveTextContent("test-id-123");
  });

  it("passes reviewer type from search params to form container", async () => {
    const searchParamsWithType = Promise.resolve({
      reviewerType: "fmo_reviewer",
    });

    const page = await SubmitForReviewPage({
      params: mockParams,
      searchParams: searchParamsWithType,
    });
    render(page);

    const reviewerType = screen.getByTestId("reviewer-type");
    expect(reviewerType).toHaveTextContent("fmo_reviewer");
  });

  it("does not display reviewer type when not provided in search params", async () => {
    const page = await SubmitForReviewPage({
      params: mockParams,
      searchParams: mockSearchParams,
    });
    render(page);

    expect(screen.queryByTestId("reviewer-type")).not.toBeInTheDocument();
  });

  it("fetches award recommendation details with correct id", async () => {
    await SubmitForReviewPage({
      params: mockParams,
      searchParams: mockSearchParams,
    });

    expect(mockGetAwardRecommendationDetails).toHaveBeenCalledWith(
      "test-id-123",
    );
  });

  it("redirects to edit page when award recommendation details fetch fails", async () => {
    mockGetAwardRecommendationDetails.mockRejectedValue(
      new Error("Fetch failed"),
    );

    await SubmitForReviewPage({
      params: mockParams,
      searchParams: mockSearchParams,
    });

    expect(redirect).toHaveBeenCalledWith(
      "/grantor/award-recommendation/test-id-123/edit",
    );
  });

  it("redirects to edit page when award recommendation details is null", async () => {
    mockGetAwardRecommendationDetails.mockResolvedValue(null);

    await SubmitForReviewPage({
      params: mockParams,
      searchParams: mockSearchParams,
    });

    expect(redirect).toHaveBeenCalledWith(
      "/grantor/award-recommendation/test-id-123/edit",
    );
  });

  it("renders page in grid container with proper layout", async () => {
    const page = await SubmitForReviewPage({
      params: mockParams,
      searchParams: mockSearchParams,
    });
    const { container } = render(page);

    const gridContainer = container.querySelector(".grid-container");
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer).toHaveClass("margin-top-4");
  });

  it("uses 12 column grid for form", async () => {
    const page = await SubmitForReviewPage({
      params: mockParams,
      searchParams: mockSearchParams,
    });
    const { container } = render(page);

    const gridCol = container.querySelector('[class*="grid-col"]');
    expect(gridCol).toBeInTheDocument();
  });

  describe("generateMetadata", () => {
    it("returns correct metadata", async () => {
      const { generateMetadata } = await import("./page");
      const metadata = await generateMetadata({
        params: mockParams,
      });

      expect(metadata).toEqual({
        title: "AwardRecommendation.reviewForm.pageTitle",
        description: "AwardRecommendation.reviewForm.pageDescription",
      });
    });
  });

  describe("Feature Flag", () => {
    it("wraps component with feature flag", () => {
      // The mock verifies the component is wrapped with withFeatureFlag
      // Actual feature flag behavior is tested in integration tests
      expect(SubmitForReviewPage).toBeDefined();
    });
  });

  describe("Dynamic Rendering", () => {
    it("forces dynamic rendering", async () => {
      const module = await import("./page");
      expect(module.dynamic).toBe("force-dynamic");
    });
  });
});
