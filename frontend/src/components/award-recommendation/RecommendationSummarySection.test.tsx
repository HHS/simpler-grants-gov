import { render, screen } from "@testing-library/react";
import { identity } from "lodash";
import { AwardRecommendationSummary } from "src/types/awardRecommendationTypes";

import { RecommendationSummarySection } from "./RecommendationSummarySection";

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

jest.mock(
  "src/components/award-recommendation/RecommendationSummaryDisplay",
  () => ({
    RecommendationSummaryDisplay: () => (
      <div data-testid="recommendation-summary-display">Summary Display</div>
    ),
  }),
);

jest.mock("src/components/core/ExpandableTextContent", () => ({
  ExpandableTextContent: ({ textContent }: { textContent: string }) => (
    <div>{textContent}</div>
  ),
}));

jest.mock(
  "src/components/award-recommendation/RecommendationSubmissionsSection",
  () => ({
    RecommendationSubmissionsSection: () => (
      <div data-testid="recommendation-submissions-section">
        Submissions Section
      </div>
    ),
  }),
);

describe("RecommendationSummarySection", () => {
  const awardRecommendationId = "test-award-recommendation-id";
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
    render(
      <RecommendationSummarySection
        awardRecommendationId={awardRecommendationId}
      />,
    );

    expect(screen.getByText("heading")).toBeInTheDocument();
  });

  it("renders the recommendations description", () => {
    render(
      <RecommendationSummarySection
        awardRecommendationId={awardRecommendationId}
      />,
    );

    expect(screen.getByText("editPageDescription")).toBeInTheDocument();
  });

  it("renders RecommendationSummaryDisplay", () => {
    render(
      <RecommendationSummarySection
        awardRecommendationId={awardRecommendationId}
        summary={mockSummary}
      />,
    );

    expect(
      screen.getByTestId("recommendation-summary-display"),
    ).toBeInTheDocument();
  });

  it("renders funding strategy textarea", () => {
    render(
      <RecommendationSummarySection
        awardRecommendationId={awardRecommendationId}
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
      <RecommendationSummarySection
        awardRecommendationId={awardRecommendationId}
        summary={mockSummary}
        fundingStrategy={mockFundingStrategy}
      />,
    );

    const textarea = screen.getByTestId("funding-strategy-textarea");
    expect(textarea).toHaveValue(mockFundingStrategy);
  });

  it("renders funding strategy description", () => {
    render(
      <RecommendationSummarySection
        awardRecommendationId={awardRecommendationId}
        summary={mockSummary}
      />,
    );

    expect(screen.getByText("fundingStrategy.description")).toBeInTheDocument();
  });

  it("renders empty textarea when no funding strategy provided", () => {
    render(
      <RecommendationSummarySection
        awardRecommendationId={awardRecommendationId}
        summary={mockSummary}
      />,
    );

    const textarea = screen.getByTestId("funding-strategy-textarea");
    expect(textarea).toHaveValue("");
  });

  it("always renders funding strategy section in edit mode", () => {
    render(
      <RecommendationSummarySection
        awardRecommendationId={awardRecommendationId}
        summary={mockSummary}
      />,
    );

    expect(screen.getByText("fundingStrategy.heading")).toBeInTheDocument();
    expect(screen.getByTestId("funding-strategy-textarea")).toBeInTheDocument();
  });

  it("always shows RecommendationSummaryDisplay even without summary data", () => {
    render(
      <RecommendationSummarySection
        awardRecommendationId={awardRecommendationId}
      />,
    );

    expect(
      screen.getByTestId("recommendation-summary-display"),
    ).toBeInTheDocument();
  });

  describe("viewMode", () => {
    it("renders view description when viewMode is true", () => {
      render(
        <RecommendationSummarySection
          awardRecommendationId={awardRecommendationId}
          summary={mockSummary}
          viewMode={true}
        />,
      );

      expect(screen.getByText("description")).toBeInTheDocument();
      expect(screen.queryByText("editPageDescription")).not.toBeInTheDocument();
    });

    it("renders edit description when viewMode is false", () => {
      render(
        <RecommendationSummarySection
          awardRecommendationId={awardRecommendationId}
          summary={mockSummary}
          viewMode={false}
        />,
      );

      expect(screen.getByText("editPageDescription")).toBeInTheDocument();
      expect(screen.queryByText("description")).not.toBeInTheDocument();
    });

    it("renders RecommendationSummaryDisplay in view mode when summary is provided", () => {
      render(
        <RecommendationSummarySection
          awardRecommendationId={awardRecommendationId}
          summary={mockSummary}
          viewMode={true}
        />,
      );

      expect(
        screen.getByTestId("recommendation-summary-display"),
      ).toBeInTheDocument();
    });

    it("does not render summary section in view mode when summary is not provided", () => {
      render(
        <RecommendationSummarySection
          awardRecommendationId={awardRecommendationId}
          viewMode={true}
        />,
      );

      expect(
        screen.queryByTestId("recommendation-summary-display"),
      ).not.toBeInTheDocument();
    });

    it("renders funding strategy with ExpandableTextContent in view mode", () => {
      render(
        <RecommendationSummarySection
          awardRecommendationId={awardRecommendationId}
          summary={mockSummary}
          fundingStrategy={mockFundingStrategy}
          viewMode={true}
        />,
      );

      expect(screen.getByText("fundingStrategy.heading")).toBeInTheDocument();
      expect(screen.getByText(mockFundingStrategy)).toBeInTheDocument();
      expect(
        screen.queryByTestId("funding-strategy-textarea"),
      ).not.toBeInTheDocument();
    });

    it("renders funding strategy section with fallback message when strategy not provided", () => {
      render(
        <RecommendationSummarySection
          awardRecommendationId={awardRecommendationId}
          summary={mockSummary}
          viewMode={true}
        />,
      );

      expect(screen.getByText("fundingStrategy.heading")).toBeInTheDocument();
      expect(
        screen.getByText("fundingStrategy.noFundingStrategyProvided"),
      ).toBeInTheDocument();
      expect(screen.queryByText(mockFundingStrategy)).not.toBeInTheDocument();
    });

    it("renders textarea in edit mode (viewMode=false)", () => {
      render(
        <RecommendationSummarySection
          awardRecommendationId={awardRecommendationId}
          summary={mockSummary}
          fundingStrategy={mockFundingStrategy}
          viewMode={false}
        />,
      );

      const textarea = screen.getByTestId("funding-strategy-textarea");
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue(mockFundingStrategy);
    });

    it("renders custom totalAvailable in view mode", () => {
      render(
        <RecommendationSummarySection
          awardRecommendationId={awardRecommendationId}
          summary={mockSummary}
          totalAvailable={300000}
          viewMode={true}
        />,
      );

      expect(
        screen.getByTestId("recommendation-summary-display"),
      ).toBeInTheDocument();
    });
  });
});
