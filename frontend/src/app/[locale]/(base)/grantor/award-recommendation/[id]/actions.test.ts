import { identity } from "lodash";

import {
  saveAwardRecommendation,
  saveAwardRecommendationSubmissionDetails,
} from "./actions";

const mockUpdateAwardRecommendationSubmissionDetails = jest.fn();
const mockUpdateAwardRecommendation = jest.fn();
const mockRedirect = jest.fn();

jest.mock("src/services/fetch/fetchers/awardRecommendationFetcher", () => ({
  updateAwardRecommendationSubmissionDetails: (
    ...args: unknown[]
  ): Promise<unknown> =>
    mockUpdateAwardRecommendationSubmissionDetails(...args) as Promise<unknown>,
  updateAwardRecommendation: (...args: unknown[]): Promise<unknown> =>
    mockUpdateAwardRecommendation(...args) as Promise<unknown>,
}));

jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("NEXT_REDIRECT");
  },
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
}));

describe("Award Recommendation Actions", () => {
  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe("saveAwardRecommendation", () => {
    const buildFormData = () => {
      const formData = new FormData();
      formData.append("award_recommendation_id", "ar-id-123");
      formData.append("award_selection_method", "merit_review_ranking_only");
      formData.append("additional_info", "More info");
      formData.append("funding_strategy", "Fund top applicants");
      formData.append("selection_method_detail", "Panel review");
      formData.append("other_key_information", "");
      return formData;
    };

    it("parses form data, calls the fetcher, and returns success", async () => {
      mockUpdateAwardRecommendation.mockResolvedValue({});

      const result = await saveAwardRecommendation({}, buildFormData());

      expect(mockUpdateAwardRecommendation).toHaveBeenCalledWith("ar-id-123", {
        award_selection_method: "merit_review_ranking_only",
        additional_info: "More info",
        funding_strategy: "Fund top applicants",
        selection_method_detail: "Panel review",
        other_key_information: null,
      });
      expect(result.success).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it("returns an error message when the fetcher throws", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      mockUpdateAwardRecommendation.mockRejectedValue(new Error("Boom"));

      const result = await saveAwardRecommendation({}, buildFormData());

      expect(result.success).toBeUndefined();
      expect(result.errorMessage).toBe("Boom");
    });
  });

  describe("saveAwardRecommendationSubmissionDetails", () => {
    const submissionId = "63588df8-f2d1-44ed-a201-5804abba696b";

    beforeEach(() => {
      mockUpdateAwardRecommendationSubmissionDetails.mockResolvedValue([]);
    });

    it("parses form data and redirects to the award recommendation edit page", async () => {
      const formData = new FormData();
      formData.append("award_recommendation_id", "ar-id-123");
      formData.append(
        "award_recommendation_application_submission_id",
        submissionId,
      );
      formData.append(
        `award_recommendation_submissions[${submissionId}][award_recommendation_type]`,
        "recommended_for_funding",
      );
      formData.append(
        `award_recommendation_submissions[${submissionId}][recommended_amount]`,
        "$50,000",
      );
      formData.append(
        `award_recommendation_submissions[${submissionId}][general_comment]`,
        "Looks good",
      );

      await expect(
        saveAwardRecommendationSubmissionDetails(formData),
      ).rejects.toThrow("NEXT_REDIRECT");

      expect(
        mockUpdateAwardRecommendationSubmissionDetails,
      ).toHaveBeenCalledWith("ar-id-123", {
        [submissionId]: {
          award_recommendation_type: "recommended_for_funding",
          recommended_amount: "50000.00",
          general_comment: "Looks good",
          has_exception: false,
          exception_detail: null,
        },
      });
      expect(mockRedirect).toHaveBeenCalledWith(
        "/grantor/award-recommendation/ar-id-123/edit",
      );
    });

    it("includes exception details when the exception checkbox is checked", async () => {
      const formData = new FormData();
      formData.append("award_recommendation_id", "ar-id-123");
      formData.append(
        "award_recommendation_application_submission_id",
        submissionId,
      );
      formData.append(
        `award_recommendation_submissions[${submissionId}][award_recommendation_type]`,
        "not_recommended",
      );
      formData.append(
        `award_recommendation_submissions[${submissionId}][has_exception]`,
        "on",
      );
      formData.append(
        `award_recommendation_submissions[${submissionId}][exception_detail]`,
        "Skipped due to budget",
      );
      formData.append(
        `award_recommendation_submissions[${submissionId}][recommended_amount]`,
        "0",
      );

      await expect(
        saveAwardRecommendationSubmissionDetails(formData),
      ).rejects.toThrow("NEXT_REDIRECT");

      expect(
        mockUpdateAwardRecommendationSubmissionDetails,
      ).toHaveBeenCalledWith("ar-id-123", {
        [submissionId]: {
          award_recommendation_type: "not_recommended",
          recommended_amount: "0.00",
          general_comment: null,
          has_exception: true,
          exception_detail: "Skipped due to budget",
        },
      });
    });
  });
});
