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
    const component = await AwardRecommendationHero({
      awardRecommendationId: "AR-26-0001",
    });
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

  it("renders buttons when buttons prop is provided", async () => {
    const mockButtons = [
      {
        type: "navigation" as const,
        label: "Edit",
        href: "/award-recommendation/AR-26-0001/edit",
        outline: true,
      },
      {
        type: "action" as const,
        label: "Submit",
        formAction: jest.fn(),
      },
    ];

    const component = await AwardRecommendationHero({
      awardRecommendationId: "AR-26-0001",
      buttons: mockButtons,
    });
    render(component);

    // Navigation links styled as buttons and action buttons
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Submit")).toBeInTheDocument();

    // Action button should have formAction attribute
    const submitButton = screen.getByRole("button", { name: "Submit" });
    expect(submitButton).toHaveAttribute("type", "submit");
  });

  it("does not render buttons when buttons prop is not provided", async () => {
    const component = await AwardRecommendationHero({
      awardRecommendationId: "AR-26-0001",
    });
    render(component);

    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toEqual(0);
  });
});
