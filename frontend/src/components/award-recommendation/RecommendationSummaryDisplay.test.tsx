import { render, screen } from "@testing-library/react";
import { identity } from "lodash";
import { AwardRecommendationSummary } from "src/types/awardRecommendationTypes";

import { RecommendationSummaryDisplay } from "./RecommendationSummaryDisplay";

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

describe("RecommendationSummaryDisplay", () => {
  const mockSummary: AwardRecommendationSummary = {
    total_received_count: 200,
    recommended_for_funding_count: 150,
    recommended_without_funding_count: 25,
    not_recommended_count: 25,
    total_recommended_amount: 250000,
  };

  it("renders summary heading", () => {
    render(<RecommendationSummaryDisplay summary={mockSummary} />);

    expect(screen.getByText("summary.heading")).toBeInTheDocument();
  });

  it("renders all summary labels", () => {
    render(<RecommendationSummaryDisplay summary={mockSummary} />);

    expect(screen.getByText("summary.appsReceived")).toBeInTheDocument();
    expect(screen.getByText("summary.appsRecommended")).toBeInTheDocument();
    expect(
      screen.getByText("summary.totalFundingRecommended"),
    ).toBeInTheDocument();
    expect(screen.getByText("summary.totalAvailable")).toBeInTheDocument();
    expect(
      screen.getByText("summary.recommendedWithoutFunding"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("summary.notRecommendedForFunding"),
    ).toBeInTheDocument();
  });

  it("displays count values from summary data", () => {
    render(<RecommendationSummaryDisplay summary={mockSummary} />);

    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
  });

  it("formats currency amounts correctly", () => {
    render(<RecommendationSummaryDisplay summary={mockSummary} />);

    const currencyElements = screen.getAllByText("$250,000");
    expect(currencyElements.length).toBeGreaterThan(0);
  });

  it("formats large currency amounts with proper comma separation", () => {
    const summaryWithLargeAmount: AwardRecommendationSummary = {
      ...mockSummary,
      total_recommended_amount: 1250000,
    };

    render(
      <RecommendationSummaryDisplay
        summary={summaryWithLargeAmount}
        totalAvailable={1500000}
      />,
    );

    expect(screen.getByText("$1,250,000")).toBeInTheDocument();
    expect(screen.getByText("$1,500,000")).toBeInTheDocument();
  });

  it("uses default totalAvailable when not provided", () => {
    render(<RecommendationSummaryDisplay summary={mockSummary} />);

    const currencyElements = screen.getAllByText("$250,000");
    expect(currencyElements.length).toBeGreaterThan(0);
  });

  it("uses custom totalAvailable when provided", () => {
    render(
      <RecommendationSummaryDisplay
        summary={mockSummary}
        totalAvailable={500000}
      />,
    );

    expect(screen.getByText("$500,000")).toBeInTheDocument();
  });
});
