import { render, screen } from "@testing-library/react";
import { identity } from "lodash";
import { mockAwardRecommendationDetails } from "src/utils/testing/fixtures";

import { redirect } from "next/navigation";

import SubmitForReviewPage from "./page";

const mockGetAwardRecommendationDetails = jest.fn();
const mockClientFetch = jest.fn();

jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
  })),
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

jest.mock("src/services/fetch/fetchers/awardRecommendationFetcher", () => ({
  getAwardRecommendationDetails: (...args: unknown[]): Promise<unknown> =>
    mockGetAwardRecommendationDetails(...args) as Promise<unknown>,
}));

jest.mock("src/services/featureFlags/withFeatureFlag", () => ({
  __esModule: true,
  default: <P, R>(
    Component: React.ComponentType<P>,
    _featureFlag: string,
    _redirectFn: () => R,
  ) => Component,
}));

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: mockClientFetch,
  }),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

jest.mock("src/components/core/fileInput/SimplerFileInput", () => ({
  SimplerFileInput: () => <div data-testid="file-input">File Input</div>,
}));

jest.mock("src/components/core/Spinner", () => ({
  __esModule: true,
  default: () => <div data-testid="spinner">Loading</div>,
}));

jest.mock(
  "src/components/award-recommendation/AwardRecommendationHero",
  () => ({
    __esModule: true,
    default: ({ heading }: { heading: string }) => (
      <div data-testid="hero">
        <h1>{heading}</h1>
      </div>
    ),
  }),
);

jest.mock("./_components/ReviewSubmissionFormContainer", () => ({
  ReviewSubmissionFormContainer: () => (
    <div data-testid="form-container">Form Container</div>
  ),
}));

jest.mock(
  "src/app/[locale]/(base)/grantor/award-recommendation/[id]/submit-for-review/actions",
  () => ({
    submitReviewForAwardRecommendation: jest.fn(),
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

    // Mock API responses - use mockImplementation to handle multiple calls
    mockClientFetch.mockImplementation((url: string) => {
      if (url.includes("/api/user/privileges")) {
        return Promise.resolve({
          data: {
            user_id: "user-123",
            agency_users: [
              {
                agency: { agency_id: "agency-1" },
                agency_user_roles: [
                  {
                    role_id: "role-1",
                    role_name: "Test Role",
                    privileges: ["update_award_recommendation"],
                  },
                ],
              },
            ],
          },
        });
      }
      if (url.includes("/api/workflows/")) {
        return Promise.resolve({
          data: {
            workflow_id: "workflow-123",
            current_workflow_state: "start",
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it("renders the page successfully", async () => {
    const page = await SubmitForReviewPage({
      params: mockParams,
      searchParams: mockSearchParams,
    });
    render(page);

    // Check for the heading text using findByText (async)
    expect(await screen.findByText("reviewForm.header")).toBeInTheDocument();
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

    await expect(
      SubmitForReviewPage({
        params: mockParams,
        searchParams: mockSearchParams,
      }),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith(
      "/grantor/award-recommendation/test-id-123/edit",
    );
  });

  it("redirects to edit page when award recommendation details is null", async () => {
    mockGetAwardRecommendationDetails.mockResolvedValue(null);

    await expect(
      SubmitForReviewPage({
        params: mockParams,
        searchParams: mockSearchParams,
      }),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith(
      "/grantor/award-recommendation/test-id-123/edit",
    );
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
      expect(SubmitForReviewPage).toBeDefined();
    });
  });

  describe("Dynamic Rendering", () => {
    it("forces dynamic rendering", async () => {
      const { dynamic } = await import("./page");
      expect(dynamic).toBe("force-dynamic");
    });
  });
});
