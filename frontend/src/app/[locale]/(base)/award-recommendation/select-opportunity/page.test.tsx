import { render, screen } from "@testing-library/react";
import SelectOpportunityPage, {
  generateMetadata,
} from "src/app/[locale]/(base)/award-recommendation/select-opportunity/page";

jest.mock("src/services/fetch/fetchers/grantorOpportunitiesFetcher", () => ({
  searchAccessibleOpportunities: jest.fn(() =>
    Promise.resolve({
      data: [],
      pagination_info: undefined,
    }),
  ),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(() =>
    Promise.resolve((key: string) => {
      const translations: Record<string, string> = {
        "AwardRecommendationSelectFundingOpportunity.pageTitle":
          "Select Funding Opportunity",
        "AwardRecommendationSelectFundingOpportunity.metaDescription":
          "Select a funding opportunity for an award recommendation",
      };

      return translations[key] ?? key;
    }),
  ),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("src/services/featureFlags/withFeatureFlag", () => ({
  __esModule: true,
  default: (Component: React.ComponentType) => Component,
}));

jest.mock(
  "src/components/award-recommendation/CreateAwardRecommendationHero",
  () => ({
    __esModule: true,
    default: () => <div data-testid="create-award-recommendation-hero" />,
  }),
);

jest.mock(
  "src/app/[locale]/(base)/award-recommendation/select-opportunity/_components/SelectFundingOpportunityContent",
  () => ({
    SelectFundingOpportunityContent: () => (
      <div data-testid="select-funding-opportunity-content" />
    ),
  }),
);

describe("SelectOpportunityPage", () => {
  it("renders the hero and select funding opportunity content", async () => {
    render(
      await SelectOpportunityPage({
        params: Promise.resolve({ locale: "en" }),
      }),
    );

    expect(
      screen.getByTestId("create-award-recommendation-hero"),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("select-funding-opportunity-content"),
    ).toBeInTheDocument();
  });

  it("generates metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(metadata).toEqual({
      title: "Select Funding Opportunity",
      description: "Select a funding opportunity for an award recommendation",
    });
  });
});
