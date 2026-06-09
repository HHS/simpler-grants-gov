import { render, screen } from "@testing-library/react";

import CreateAwardRecommendationHeroContent from "src/components/award-recommendation/CreateAwardRecommendationHero";

jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(() =>
    Promise.resolve((key: string) => {
      const translations: Record<string, string> = {
        awardRecs: "Award Recommendations",
        "heroButtons.create": "Create",
        createHeroTitle: "Create Award Recommendation",
      };

      return translations[key] ?? key;
    }),
  ),
}));

describe("CreateAwardRecommendationHeroContent", () => {
  it("renders the correct wrapper with data-testid", async () => {
    render(await CreateAwardRecommendationHeroContent());

    const wrapper = screen.getByTestId("award-recommendation-hero");
    expect(wrapper).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    render(await CreateAwardRecommendationHeroContent());

    expect(screen.getByText("Award Recommendations")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  it("renders the create award recommendation hero title", async () => {
    render(await CreateAwardRecommendationHeroContent());

    const title = screen.getByRole("heading", {
      name: "Create Award Recommendation",
      level: 1,
    });

    expect(title).toBeInTheDocument();
  });
});
