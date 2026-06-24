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

describe("AwardRecommendationHero", () => {
  it("renders hero using details from props", async () => {
    const component = await AwardRecommendationHero({
      awardRecommendationDetails: mockAwardRecommendationDetails,
    });
    render(component);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(
      mockAwardRecommendationDetails.award_recommendation_number,
    );

    // Check for formatted date from created_at
    const formattedDate = mockAwardRecommendationDetails.created_at
      ? new Date(mockAwardRecommendationDetails.created_at).toLocaleDateString()
      : new Date().toLocaleDateString();
    expect(screen.getByText(formattedDate)).toBeInTheDocument();

    expect(
      screen.getByTestId("award-recommendation-status-pending-review"),
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
      awardRecommendationDetails: mockAwardRecommendationDetails,
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
      awardRecommendationDetails: mockAwardRecommendationDetails,
    });
    render(component);

    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toEqual(0);
  });

  it("renders custom heading when heading prop is provided", async () => {
    const customHeading = "Add risk or condition";
    const component = await AwardRecommendationHero({
      awardRecommendationDetails: mockAwardRecommendationDetails,
      heading: customHeading,
    });
    render(component);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(customHeading);
    expect(heading).not.toHaveTextContent(
      mockAwardRecommendationDetails.award_recommendation_number,
    );
  });

  it("hides date and status when showDateAndStatus is false", async () => {
    const component = await AwardRecommendationHero({
      awardRecommendationDetails: mockAwardRecommendationDetails,
      showDateAndStatus: false,
    });
    render(component);

    const formattedDate = mockAwardRecommendationDetails.created_at
      ? new Date(mockAwardRecommendationDetails.created_at).toLocaleDateString()
      : new Date().toLocaleDateString();
    expect(screen.queryByText(formattedDate)).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("award-recommendation-status-pending-review"),
    ).not.toBeInTheDocument();
  });

  it("shows date and status by default when showDateAndStatus is not provided", async () => {
    const component = await AwardRecommendationHero({
      awardRecommendationDetails: mockAwardRecommendationDetails,
    });
    render(component);

    const formattedDate = mockAwardRecommendationDetails.created_at
      ? new Date(mockAwardRecommendationDetails.created_at).toLocaleDateString()
      : new Date().toLocaleDateString();
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
    expect(
      screen.getByTestId("award-recommendation-status-pending-review"),
    ).toBeInTheDocument();
  });

  it("shows date and status when showDateAndStatus is true", async () => {
    const component = await AwardRecommendationHero({
      awardRecommendationDetails: mockAwardRecommendationDetails,
      showDateAndStatus: true,
    });
    render(component);

    const formattedDate = mockAwardRecommendationDetails.created_at
      ? new Date(mockAwardRecommendationDetails.created_at).toLocaleDateString()
      : new Date().toLocaleDateString();
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
    expect(
      screen.getByTestId("award-recommendation-status-pending-review"),
    ).toBeInTheDocument();
  });
});
