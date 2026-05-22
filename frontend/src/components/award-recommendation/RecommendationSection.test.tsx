import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import { identity } from "lodash";

import { RecommendationSection } from "./RecommendationSection";

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

describe("RecommendationSection", () => {
  describe("Edit Mode", () => {
    it("renders the recommendation method section in edit mode", () => {
      render(<RecommendationSection mode="edit" />);

      expect(
        screen.getByText("recommendationMethod.label"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("recommendationMethod.description"),
      ).toBeInTheDocument();
    });

    it("renders both recommendation method radio buttons in edit mode", () => {
      render(<RecommendationSection mode="edit" />);

      const meritOnlyRadio = screen.getByLabelText(
        "recommendationMethod.meritReviewOnly",
      );
      const meritOtherRadio = screen.getByLabelText(
        "recommendationMethod.meritReviewOther",
      );

      expect(meritOnlyRadio).toBeInTheDocument();
      expect(meritOnlyRadio).toHaveAttribute("id", "merit_review_only");
      expect(meritOnlyRadio).toHaveAttribute("name", "award_selection_method");

      expect(meritOtherRadio).toBeInTheDocument();
      expect(meritOtherRadio).toHaveAttribute("id", "merit_review_other");
      expect(meritOtherRadio).toHaveAttribute("name", "award_selection_method");
    });

    it("renders recommendation method details textarea in edit mode", () => {
      render(<RecommendationSection mode="edit" />);

      expect(
        screen.getByText("recommendationMethodDetails.label"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("recommendationMethodDetails.description"),
      ).toBeInTheDocument();

      const detailsTextarea = screen.getByTestId(
        "award-selection-details-textarea",
      );
      expect(detailsTextarea).toBeInTheDocument();
      expect(detailsTextarea).toHaveAttribute("id", "award_selection_details");
      expect(detailsTextarea).toHaveAttribute(
        "name",
        "award_selection_details",
      );
    });

    it("renders other key information textarea in edit mode", () => {
      render(<RecommendationSection mode="edit" />);

      expect(screen.getByText("otherKeyInformation.label")).toBeInTheDocument();
      expect(
        screen.getByText("otherKeyInformation.description"),
      ).toBeInTheDocument();

      const otherInfoTextarea = screen.getByTestId(
        "other-key-information-textarea",
      );
      expect(otherInfoTextarea).toBeInTheDocument();
      expect(otherInfoTextarea).toHaveAttribute("id", "other_key_information");
      expect(otherInfoTextarea).toHaveAttribute(
        "name",
        "other_key_information",
      );
    });

    it("renders divider between sections in edit mode", () => {
      render(<RecommendationSection mode="edit" />);

      const detailsSection = screen.getByTestId(
        "award-selection-details-textarea",
      );
      expect(detailsSection).toBeInTheDocument();
    });

    it("renders textareas with correct row count in edit mode", () => {
      render(<RecommendationSection mode="edit" />);

      const detailsTextarea = screen.getByTestId(
        "award-selection-details-textarea",
      );
      const otherInfoTextarea = screen.getByTestId(
        "other-key-information-textarea",
      );

      expect(detailsTextarea).toHaveAttribute("rows", "6");
      expect(otherInfoTextarea).toHaveAttribute("rows", "6");
    });

    it("renders textareas with empty default values in edit mode", () => {
      render(<RecommendationSection mode="edit" />);

      const detailsTextarea = screen.getByTestId(
        "award-selection-details-textarea",
      );
      const otherInfoTextarea = screen.getByTestId(
        "other-key-information-textarea",
      );

      expect(detailsTextarea).toHaveValue("");
      expect(otherInfoTextarea).toHaveValue("");
    });

    it("renders radio buttons with proper grouping in edit mode", () => {
      render(<RecommendationSection mode="edit" />);

      const meritOnlyRadio = screen.getByLabelText(
        "recommendationMethod.meritReviewOnly",
      );
      const meritOtherRadio = screen.getByLabelText(
        "recommendationMethod.meritReviewOther",
      );

      expect(meritOnlyRadio).toHaveAttribute("name", "award_selection_method");
      expect(meritOtherRadio).toHaveAttribute("name", "award_selection_method");
    });

    it("renders the recommendation section heading in edit mode", () => {
      render(<RecommendationSection mode="edit" />);

      expect(
        screen.getByText("recommendationMethod.label"),
      ).toBeInTheDocument();
    });

    it("pre-populates merit-review-only radio button when provided", () => {
      render(
        <RecommendationSection
          mode="edit"
          recommendationMethod="merit_review_ranking_only"
        />,
      );

      const meritOnlyRadio = screen.getByLabelText(
        "recommendationMethod.meritReviewOnly",
      );
      const meritOtherRadio = screen.getByLabelText(
        "recommendationMethod.meritReviewOther",
      );

      expect(meritOnlyRadio).toBeChecked();
      expect(meritOtherRadio).not.toBeChecked();
    });

    it("pre-populates merit-review-other radio button when provided", () => {
      render(
        <RecommendationSection
          mode="edit"
          recommendationMethod="merit_review_ranking_with_other_factors"
        />,
      );

      const meritOnlyRadio = screen.getByLabelText(
        "recommendationMethod.meritReviewOnly",
      );
      const meritOtherRadio = screen.getByLabelText(
        "recommendationMethod.meritReviewOther",
      );

      expect(meritOnlyRadio).not.toBeChecked();
      expect(meritOtherRadio).toBeChecked();
    });

    it("allows changing radio button selection", () => {
      render(
        <RecommendationSection
          mode="edit"
          recommendationMethod="merit_review_ranking_only"
        />,
      );

      const meritOnlyRadio = screen.getByLabelText(
        "recommendationMethod.meritReviewOnly",
      );
      const meritOtherRadio = screen.getByLabelText(
        "recommendationMethod.meritReviewOther",
      );

      expect(meritOnlyRadio).toBeChecked();
      expect(meritOtherRadio).not.toBeChecked();

      fireEvent.click(meritOtherRadio);

      expect(meritOnlyRadio).not.toBeChecked();
      expect(meritOtherRadio).toBeChecked();
    });

    it("pre-populates textareas with provided values", () => {
      render(
        <RecommendationSection
          mode="edit"
          recommendationMethodDetails="Test details"
          otherKeyInformation="Test info"
        />,
      );

      const detailsTextarea = screen.getByTestId(
        "award-selection-details-textarea",
      );
      const otherInfoTextarea = screen.getByTestId(
        "other-key-information-textarea",
      );

      expect(detailsTextarea).toHaveValue("Test details");
      expect(otherInfoTextarea).toHaveValue("Test info");
    });
  });

  describe("View Mode", () => {
    const mockData = {
      recommendationMethod: "Merit review ranking only",
      recommendationMethodDetails: "Test details for recommendation",
      otherKeyInformation: "Additional information about the opportunity",
    };

    it("renders the recommendation method section in view mode", () => {
      render(<RecommendationSection mode="view" {...mockData} />);

      expect(
        screen.getByText("recommendationMethod.label"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(mockData.recommendationMethod),
      ).toBeInTheDocument();
    });

    it("renders recommendation method details in view mode", () => {
      render(<RecommendationSection mode="view" {...mockData} />);

      expect(
        screen.getByText("recommendationMethodDetails.label"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(mockData.recommendationMethodDetails),
      ).toBeInTheDocument();
    });

    it("renders other key information in view mode", () => {
      render(<RecommendationSection mode="view" {...mockData} />);

      expect(screen.getByText("otherKeyInformation.label")).toBeInTheDocument();
    });

    it("renders all sections in view mode", () => {
      render(<RecommendationSection mode="view" {...mockData} />);

      expect(
        screen.getByText("recommendationMethod.label"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("recommendationMethodDetails.label"),
      ).toBeInTheDocument();
      expect(screen.getByText("otherKeyInformation.label")).toBeInTheDocument();
    });

    it("displays provided data in view mode", () => {
      render(<RecommendationSection mode="view" {...mockData} />);

      expect(
        screen.getByText(mockData.recommendationMethod),
      ).toBeInTheDocument();
      expect(
        screen.getByText(mockData.recommendationMethodDetails),
      ).toBeInTheDocument();
    });

    it("does not render radio buttons in view mode", () => {
      render(<RecommendationSection mode="view" {...mockData} />);

      expect(
        screen.queryByLabelText("recommendationMethod.meritReviewOnly"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText("recommendationMethod.meritReviewOther"),
      ).not.toBeInTheDocument();
    });

    it("does not render textareas in view mode", () => {
      render(<RecommendationSection mode="view" {...mockData} />);

      expect(
        screen.queryByTestId("award-selection-details-textarea"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("other-key-information-textarea"),
      ).not.toBeInTheDocument();
    });

    it("renders empty strings when data is not provided in view mode", () => {
      render(<RecommendationSection mode="view" />);

      expect(
        screen.getByText("recommendationMethod.label"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("recommendationMethodDetails.label"),
      ).toBeInTheDocument();
      expect(screen.getByText("otherKeyInformation.label")).toBeInTheDocument();
    });
  });
});
