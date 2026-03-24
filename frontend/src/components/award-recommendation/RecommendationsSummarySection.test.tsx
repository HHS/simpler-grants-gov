import { render, screen } from "@testing-library/react";
import { identity } from "lodash";
import { AwardRecommendationSummary } from "src/types/awardRecommendationTypes";

import { RecommendationsSummarySection } from "./RecommendationsSummarySection";

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

describe("RecommendationsSummarySection", () => {
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
    render(<RecommendationsSummarySection />);

    expect(screen.getByText("recommendations.heading")).toBeInTheDocument();
  });

  it("renders the recommendations description", () => {
    render(<RecommendationsSummarySection />);

    expect(screen.getByText("recommendations.description")).toBeInTheDocument();
  });

  it("renders summary section with all data when summary is provided", () => {
    render(<RecommendationsSummarySection summary={mockSummary} />);

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
      <RecommendationsSummarySection
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
    render(<RecommendationsSummarySection summary={mockSummary} />);

    expect(
      screen.getByText("recommendations.summary.recommendedWithoutFunding"),
    ).toBeInTheDocument();
  });

  it("renders not recommended for funding count", () => {
    render(<RecommendationsSummarySection summary={mockSummary} />);

    expect(
      screen.getByText("recommendations.summary.notRecommendedForFunding"),
    ).toBeInTheDocument();
  });

  it("renders funding strategy section when provided in view mode", () => {
    render(
      <RecommendationsSummarySection
        mode="view"
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
    render(<RecommendationsSummarySection />);

    expect(
      screen.queryByText("recommendations.summary.heading"),
    ).not.toBeInTheDocument();
  });

  it("does not render funding strategy content in view mode when not provided", () => {
    render(<RecommendationsSummarySection mode="view" summary={mockSummary} />);

    expect(
      screen.getByText("recommendations.fundingStrategy.heading"),
    ).toBeInTheDocument();
    expect(screen.queryByText(mockFundingStrategy)).not.toBeInTheDocument();
  });

  it("formats currency amounts correctly", () => {
    const summaryWithLargeAmount: AwardRecommendationSummary = {
      ...mockSummary,
      total_recommended_amount: 1250000,
    };

    render(
      <RecommendationsSummarySection
        summary={summaryWithLargeAmount}
        totalAvailable={1500000}
      />,
    );

    expect(screen.getByText("$1,250,000")).toBeInTheDocument();
    expect(screen.getByText("$1,500,000")).toBeInTheDocument();
  });

  describe("Edit mode", () => {
    it("renders funding strategy textarea in edit mode", () => {
      render(
        <RecommendationsSummarySection
          mode="edit"
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
        <RecommendationsSummarySection
          mode="edit"
          summary={mockSummary}
          fundingStrategy={mockFundingStrategy}
        />,
      );

      const textarea = screen.getByTestId("funding-strategy-textarea");
      expect(textarea).toHaveValue(mockFundingStrategy);
    });

    it("renders funding strategy description in edit mode", () => {
      render(
        <RecommendationsSummarySection mode="edit" summary={mockSummary} />,
      );

      expect(
        screen.getByText("recommendations.fundingStrategy.description"),
      ).toBeInTheDocument();
    });

    it("renders empty textarea when no funding strategy provided in edit mode", () => {
      render(
        <RecommendationsSummarySection mode="edit" summary={mockSummary} />,
      );

      const textarea = screen.getByTestId("funding-strategy-textarea");
      expect(textarea).toHaveValue("");
    });

    it("renders funding strategy section in edit mode even when no data", () => {
      render(
        <RecommendationsSummarySection mode="edit" summary={mockSummary} />,
      );

      expect(
        screen.getByText("recommendations.fundingStrategy.heading"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("funding-strategy-textarea"),
      ).toBeInTheDocument();
    });

    it("does not render read-only funding strategy display in edit mode", () => {
      render(
        <RecommendationsSummarySection
          mode="edit"
          summary={mockSummary}
          fundingStrategy={mockFundingStrategy}
        />,
      );

      const textarea = screen.getByTestId("funding-strategy-textarea");
      expect(textarea).toBeInTheDocument();
    });

    it("shows summary section in edit mode even without summary data", () => {
      render(<RecommendationsSummarySection mode="edit" />);

      expect(
        screen.getByText("recommendations.summary.heading"),
      ).toBeInTheDocument();
    });

    it("displays 0 for apps recommended when no summary data in edit mode", () => {
      render(<RecommendationsSummarySection mode="edit" />);

      expect(
        screen.getByText("recommendations.summary.appsRecommended"),
      ).toBeInTheDocument();
      const values = screen.getAllByText("0");
      expect(values.length).toBeGreaterThan(0);
    });

    it("displays $0 for total funding recommended when no summary data in edit mode", () => {
      render(<RecommendationsSummarySection mode="edit" />);

      expect(
        screen.getByText("recommendations.summary.totalFundingRecommended"),
      ).toBeInTheDocument();
      expect(screen.getByText("$0")).toBeInTheDocument();
    });

    it("displays 0 applications for recommended without funding when no summary data in edit mode", () => {
      render(<RecommendationsSummarySection mode="edit" />);

      expect(
        screen.getByText("recommendations.summary.recommendedWithoutFunding"),
      ).toBeInTheDocument();
      expect(screen.getAllByText("0").length).toBeGreaterThan(0);
    });

    it("displays 0 applications for not recommended for funding when no summary data in edit mode", () => {
      render(<RecommendationsSummarySection mode="edit" />);

      expect(
        screen.getByText("recommendations.summary.notRecommendedForFunding"),
      ).toBeInTheDocument();
      expect(screen.getAllByText("0").length).toBeGreaterThan(0);
    });

    it("displays actual count values when summary data exists in edit mode", () => {
      render(
        <RecommendationsSummarySection mode="edit" summary={mockSummary} />,
      );

      expect(screen.getByText("150")).toBeInTheDocument();
      expect(screen.getAllByText("$250,000")).toHaveLength(2);
    });
  });
});
