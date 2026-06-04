import { render, screen } from "@testing-library/react";
import { getAwardRecommendationDetails } from "src/services/fetch/fetchers/awardRecommendationFetcher";
import { mockAwardRecommendationDetails } from "src/utils/testing/fixtures";

import AwardRecommendationRisksPageContent from "./page";

jest.mock("src/services/fetch/fetchers/awardRecommendationFetcher");
jest.mock("src/services/featureFlags/withFeatureFlag", () => ({
  __esModule: true,
  default: <P, R>(Component: React.ComponentType<P>) => Component,
}));

jest.mock("src/services/auth/sessionUtils", () => ({
  decrypt: jest.fn(),
  encrypt: jest.fn(),
  CLIENT_JWT_ENCRYPTION_ALGORITHM: "HS256",
  API_JWT_ENCRYPTION_ALGORITHM: "RS256",
  newExpirationDate: () => new Date(0),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(() =>
    Promise.resolve((key: string) => {
      const translations: Record<string, string> = {
        "AwardRecommendation.risks.pageTitle": "Risks and Conditions",
        "AwardRecommendation.risks.metaDescription": "Manage risks",
        "AwardRecommendation.risks.heading": "Risks and Conditions",
        "AwardRecommendation.risks.description":
          "Review and manage risks for applications",
        "AwardRecommendation.heroButtons.backToEdit": "Back to Edit",
        "AwardRecommendation.errorHeadingAuthentication":
          "Authentication Error",
        "AwardRecommendation.authenticationError": "You are not authenticated",
        "AwardRecommendation.errorHeadingAwardRecommendation":
          "Award Recommendation Error",
        "AwardRecommendation.awardRecommendationFetchError":
          "Failed to fetch award recommendation",
        "AwardRecommendation.awardRecommendationNotFound":
          "Award recommendation not found",
      };
      return translations[key] || key;
    }),
  ),
}));

jest.mock(
  "src/components/award-recommendation/AwardRecommendationHero",
  () => ({
    __esModule: true,
    default: () => <div data-testid="award-recommendation-hero">Hero</div>,
  }),
);

jest.mock("src/components/award-recommendation/RisksTable", () => ({
  __esModule: true,
  default: ({ awardRecommendationId }: { awardRecommendationId: string }) => (
    <div data-testid="risks-table">Risks Table for {awardRecommendationId}</div>
  ),
}));

describe("AwardRecommendationRisksPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the risks page with table", async () => {
    (getAwardRecommendationDetails as jest.Mock).mockResolvedValue(
      mockAwardRecommendationDetails,
    );

    const params = Promise.resolve({
      locale: "en",
      id: "test-award-id",
    });

    const page = await AwardRecommendationRisksPageContent({ params });
    render(page);

    expect(screen.getByText("risks.heading")).toBeInTheDocument();
    expect(screen.getByText("risks.description")).toBeInTheDocument();
    expect(screen.getByTestId("risks-table")).toBeInTheDocument();
    expect(
      screen.getByText("Risks Table for test-award-id"),
    ).toBeInTheDocument();
  });

  it("shows error when award recommendation is not found", async () => {
    (getAwardRecommendationDetails as jest.Mock).mockRejectedValue(
      new Error("Not found"),
    );

    const params = Promise.resolve({
      locale: "en",
      id: "invalid-id",
    });

    const page = await AwardRecommendationRisksPageContent({ params });
    render(page);

    expect(
      screen.getByText("errorHeadingAwardRecommendation"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("awardRecommendationFetchError"),
    ).toBeInTheDocument();
  });

  it("renders hero with back to edit button", async () => {
    (getAwardRecommendationDetails as jest.Mock).mockResolvedValue(
      mockAwardRecommendationDetails,
    );

    const params = Promise.resolve({
      locale: "en",
      id: "test-award-id",
    });

    const page = await AwardRecommendationRisksPageContent({ params });
    render(page);

    expect(screen.getByTestId("award-recommendation-hero")).toBeInTheDocument();
  });
});
