import { render, screen } from "@testing-library/react";
import { identity } from "lodash";
import { AwardRecommendationSummary } from "src/types/awardRecommendationTypes";

import { EditRecommendationSummarySection } from "./EditRecommendationSummarySection";

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

describe("EditRecommendationSummarySection", () => {
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
    render(<EditRecommendationSummarySection />);

    expect(screen.getByText("recommendations.heading")).toBeInTheDocument();
  });

  it("renders the recommendations description", () => {
    render(<EditRecommendationSummarySection />);

    expect(
      screen.getByText("recommendations.editPageDescription"),
    ).toBeInTheDocument();
  });

  it("renders summary section with all labels", () => {
    render(<EditRecommendationSummarySection summary={mockSummary} />);

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
      <EditRecommendationSummarySection
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
    render(<EditRecommendationSummarySection summary={mockSummary} />);

    expect(
      screen.getByText("recommendations.summary.recommendedWithoutFunding"),
    ).toBeInTheDocument();
  });

  it("renders not recommended for funding count", () => {
    render(<EditRecommendationSummarySection summary={mockSummary} />);

    expect(
      screen.getByText("recommendations.summary.notRecommendedForFunding"),
    ).toBeInTheDocument();
  });

  it("renders funding strategy textarea", () => {
    render(
      <EditRecommendationSummarySection
        summary={mockSummary}
        fundingStrategy={mockFundingStrategy}
      />,
    );

    const textarea = screen.getByTestId("funding-strategy-textarea");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute("id", "funding_strategy");
    expect(textarea).toHaveAttribute("name", "funding_strategy");
  });

  it("pre-populates funding strategy textarea with existing data", () => {
    render(
      <EditRecommendationSummarySection
        summary={mockSummary}
        fundingStrategy={mockFundingStrategy}
      />,
    );

    const textarea = screen.getByTestId("funding-strategy-textarea");
    expect(textarea).toHaveValue(mockFundingStrategy);
  });

  it("renders funding strategy description", () => {
    render(<EditRecommendationSummarySection summary={mockSummary} />);

    expect(
      screen.getByText("recommendations.fundingStrategy.description"),
    ).toBeInTheDocument();
  });

  it("renders empty textarea when no funding strategy provided", () => {
    render(<EditRecommendationSummarySection summary={mockSummary} />);

    const textarea = screen.getByTestId("funding-strategy-textarea");
    expect(textarea).toHaveValue("");
  });

  it("always renders funding strategy section in edit mode", () => {
    render(<EditRecommendationSummarySection summary={mockSummary} />);

    expect(
      screen.getByText("recommendations.fundingStrategy.heading"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("funding-strategy-textarea")).toBeInTheDocument();
  });

  it("always shows summary section even without summary data", () => {
    render(<EditRecommendationSummarySection />);

    expect(
      screen.getByText("recommendations.summary.heading"),
    ).toBeInTheDocument();
  });

  it("displays 0 for apps recommended when no summary data", () => {
    render(<EditRecommendationSummarySection />);

    expect(
      screen.getByText("recommendations.summary.appsRecommended"),
    ).toBeInTheDocument();
    const values = screen.getAllByText("0");
    expect(values.length).toBeGreaterThan(0);
  });

  it("displays 0 applications for recommended without funding when no summary data", () => {
    render(<EditRecommendationSummarySection />);

    expect(
      screen.getByText("recommendations.summary.recommendedWithoutFunding"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });

  it("displays 0 applications for not recommended for funding when no summary data", () => {
    render(<EditRecommendationSummarySection />);

    expect(
      screen.getByText("recommendations.summary.notRecommendedForFunding"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });

  it("displays actual count values when summary data exists", () => {
    render(<EditRecommendationSummarySection summary={mockSummary} />);

    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getAllByText("$250,000")).toHaveLength(2);
  });

  it("formats currency amounts correctly", () => {
    const summaryWithLargeAmount: AwardRecommendationSummary = {
      ...mockSummary,
      total_recommended_amount: 1250000,
    };

    render(
      <EditRecommendationSummarySection
        summary={summaryWithLargeAmount}
        totalAvailable={1500000}
      />,
    );

    expect(screen.getByText("$1,250,000")).toBeInTheDocument();
    expect(screen.getByText("$1,500,000")).toBeInTheDocument();
  });

  it("uses default totalAvailable when not provided", () => {
    render(<EditRecommendationSummarySection />);

    expect(screen.getByText("$250,000")).toBeInTheDocument();
  });
});
