import { render, screen } from "@testing-library/react";
import { identity } from "lodash";
import { mockAwardRecommendationDetails } from "src/utils/testing/fixtures";

import AwardRecommendationHero from "src/components/award-recommendation/AwardRecommendationHero";

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  use: jest.fn(() => ({
    locale: "en",
  })),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
}));

jest.mock("src/services/fetch/fetchers/awardRecommendationFetcher", () => ({
  getAwardRecommendationDetails: jest
    .fn()
    .mockResolvedValue(mockAwardRecommendationDetails),
}));

describe("AwardRecommendationHero", () => {
  it("renders hero using details from getAwardRecommendationDetails", async () => {
    const component = await AwardRecommendationHero();
    render(component);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(
      mockAwardRecommendationDetails.recordNumber,
    );

    expect(
      screen.getByText(mockAwardRecommendationDetails.datePrepared),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("award-recommendation-status-in-progress"),
    ).toBeInTheDocument();
  });

  it("renders buttons", async () => {
    const component = await AwardRecommendationHero();
    render(component);

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toEqual(2);
  });
});
