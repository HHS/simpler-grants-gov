import { render, screen } from "@testing-library/react";
import { identity } from "lodash";
import { AwardRecommendationSummary } from "src/types/awardRecommendationTypes";

import { ViewRecommendationSummarySection } from "./ViewRecommendationSummarySection";

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

describe("ViewRecommendationSummarySection", () => {
  const mockSummary: AwardRecommendationSummary = {
    total_received_count: 200,
    recommended_for_funding_count: 150,
    recommended_without_funding_count: 25,
    not_recommended_count: 25,
    total_recommended_amount: 250000,
  };

  const mockFundingStrategy =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

  it("renders the recommendations heading", () => {
    render(<ViewRecommendationSummarySection summary={mockSummary} />);

    expect(screen.getByText("recommendations.heading")).toBeInTheDocument();
  });

  it("renders the recommendations description", () => {
    render(<ViewRecommendationSummarySection summary={mockSummary} />);

    expect(screen.getByText("recommendations.description")).toBeInTheDocument();
  });

  it("renders summary section with all data when summary is provided", () => {
    render(<ViewRecommendationSummarySection summary={mockSummary} />);

    expect(
      screen.getByText("recommendations.summary.heading"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("recommendations.summary.appsReceived"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("recommendations.summary.appsRecommended"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("recommendations.summary.totalFundingRecommended"),
    ).toBeInTheDocument();
  });

  it("renders total available amount", () => {
    render(
      <ViewRecommendationSummarySection
        summary={mockSummary}
        totalAvailable={300000}
      />,
    );

    expect(
      screen.getByText("recommendations.summary.totalAvailable"),
    ).toBeInTheDocument();
    expect(screen.getByText("$300,000")).toBeInTheDocument();
  });

  it("renders recommended without funding count", () => {
    render(<ViewRecommendationSummarySection summary={mockSummary} />);

    expect(
      screen.getByText("recommendations.summary.recommendedWithoutFunding"),
    ).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("renders not recommended for funding count", () => {
    render(<ViewRecommendationSummarySection summary={mockSummary} />);

    expect(
      screen.getByText("recommendations.summary.notRecommendedForFunding"),
    ).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("renders funding strategy section when provided", () => {
    render(
      <ViewRecommendationSummarySection
        summary={mockSummary}
        fundingStrategy={mockFundingStrategy}
      />,
    );

    expect(
      screen.getByText("recommendations.fundingStrategy.heading"),
    ).toBeInTheDocument();
    expect(screen.getByText(mockFundingStrategy)).toBeInTheDocument();
  });

  it("does not render summary section when summary is not provided", () => {
    render(<ViewRecommendationSummarySection />);

    expect(
      screen.queryByText("recommendations.summary.heading"),
    ).not.toBeInTheDocument();
  });

  it("does not render funding strategy content when not provided", () => {
    render(<ViewRecommendationSummarySection summary={mockSummary} />);

    expect(
      screen.queryByText("recommendations.fundingStrategy.heading"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(mockFundingStrategy)).not.toBeInTheDocument();
  });

  it("formats currency amounts correctly", () => {
    const summaryWithLargeAmount: AwardRecommendationSummary = {
      ...mockSummary,
      total_recommended_amount: 1250000,
    };

    render(
      <ViewRecommendationSummarySection
        summary={summaryWithLargeAmount}
        totalAvailable={1500000}
      />,
    );

    expect(screen.getByText("$1,250,000")).toBeInTheDocument();
    expect(screen.getByText("$1,500,000")).toBeInTheDocument();
  });

  it("displays actual count values from summary data", () => {
    render(<ViewRecommendationSummarySection summary={mockSummary} />);

    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getByText("$250,000")).toBeInTheDocument();
  });

  it("uses default totalAvailable when not provided", () => {
    render(<ViewRecommendationSummarySection summary={mockSummary} />);

    expect(screen.getByText("$250,000")).toBeInTheDocument();
  });
});
