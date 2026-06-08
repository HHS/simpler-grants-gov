import { render, screen } from "@testing-library/react";

import CreateAwardRecommendationPage, {
  generateMetadata,
} from "src/app/[locale]/(base)/award-recommendation/create/page";

jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(() =>
    Promise.resolve((key: string) => {
      const translations: Record<string, string> = {
        "CreateAwardRecommendation.pageTitle": "Create Award Recommendation",
        "CreateAwardRecommendation.metaDescription":
          "Create an award recommendation",
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
  "src/app/[locale]/(base)/award-recommendation/create/_components/CreateRecommendationContent",
  () => ({
    CreateRecommendationContent: () => (
      <div data-testid="create-recommendation-content" />
    ),
  }),
);

describe("CreateAwardRecommendationPage", () => {
  it("renders the hero and create recommendation content", async () => {
    render(
      await CreateAwardRecommendationPage({
        params: Promise.resolve({ locale: "en" }),
      }),
    );

    expect(
      screen.getByTestId("create-award-recommendation-hero"),
    ).toBeInTheDocument();

    expect(screen.getByTestId("create-recommendation-content")).toBeInTheDocument();
  });

  it("generates metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(metadata).toEqual({
      title: "Create Award Recommendation",
      description: "Create an award recommendation",
    });
  });
});