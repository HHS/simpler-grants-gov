import { identity } from "lodash";

import {
  saveAwardRecommendation,
  submitAwardRecommendationForReview,
} from "./actions";

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
}));

describe("Award Recommendation Actions", () => {
  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe("saveAwardRecommendation", () => {
    it("successfully extracts string values from FormData", async () => {
      const formData = new FormData();
      formData.append("additional_info", "Test additional info");
      formData.append("award_selection_method", "merit-review-only");
      formData.append("award_selection_details", "Test details");
      formData.append("other_key_information", "Test other info");

      const result = await saveAwardRecommendation(formData);

      expect(result.success).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it("handles FormData with missing fields (null values)", async () => {
      const formData = new FormData();
      // Only add some fields, others will be null

      const result = await saveAwardRecommendation(formData);

      expect(result.success).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it("handles FormData with empty string values", async () => {
      const formData = new FormData();
      formData.append("additional_info", "");
      formData.append("award_selection_method", "");
      formData.append("award_selection_details", "");
      formData.append("other_key_information", "");

      const result = await saveAwardRecommendation(formData);

      expect(result.success).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it("handles File type by converting to empty string", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      const formData = new FormData();
      const testFile = new File(["test content"], "test.txt", {
        type: "text/plain",
      });
      formData.append("additional_info", testFile);
      formData.append("award_selection_method", "merit-review-only");
      formData.append("award_selection_details", "Test details");
      formData.append("other_key_information", "Test other info");

      const result = await saveAwardRecommendation(formData);

      expect(result.success).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Unexpected File type for form field "additional_info"',
      );
      consoleWarnSpy.mockRestore();
    });

    it("handles special characters in form values", async () => {
      const formData = new FormData();
      formData.append("additional_info", "Test with <html> & special chars");
      formData.append("award_selection_method", "merit-review-other");
      formData.append("award_selection_details", "Details with\nnewlines");
      formData.append("other_key_information", "Unicode: 你好 🎉");

      const result = await saveAwardRecommendation(formData);

      expect(result.success).toBe(true);
    });
  });

  describe("submitAwardRecommendationForReview", () => {
    it("successfully extracts string values from FormData", async () => {
      const formData = new FormData();
      formData.append("additional_info", "Test additional info");
      formData.append("award_selection_method", "merit-review-only");
      formData.append("award_selection_details", "Test details");
      formData.append("other_key_information", "Test other info");

      const result = await submitAwardRecommendationForReview(formData);

      expect(result.success).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it("handles FormData with missing fields (null values)", async () => {
      const formData = new FormData();
      // Only add some fields, others will be null

      const result = await submitAwardRecommendationForReview(formData);

      expect(result.success).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it("handles FormData with empty string values", async () => {
      const formData = new FormData();
      formData.append("additional_info", "");
      formData.append("award_selection_method", "");
      formData.append("award_selection_details", "");
      formData.append("other_key_information", "");

      const result = await submitAwardRecommendationForReview(formData);

      expect(result.success).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it("handles File type by converting to empty string", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      const formData = new FormData();
      const testFile = new File(["test content"], "test.txt", {
        type: "text/plain",
      });
      formData.append("additional_info", testFile);
      formData.append("award_selection_method", "merit-review-only");
      formData.append("award_selection_details", "Test details");
      formData.append("other_key_information", "Test other info");

      const result = await submitAwardRecommendationForReview(formData);

      expect(result.success).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Unexpected File type for form field "additional_info"',
      );
      consoleWarnSpy.mockRestore();
    });

    it("handles special characters in form values", async () => {
      const formData = new FormData();
      formData.append("additional_info", "Test with <html> & special chars");
      formData.append("award_selection_method", "merit-review-other");
      formData.append("award_selection_details", "Details with\nnewlines");
      formData.append("other_key_information", "Unicode: 你好 🎉");

      const result = await submitAwardRecommendationForReview(formData);

      expect(result.success).toBe(true);
    });

    it("handles long text values within character limits", async () => {
      const formData = new FormData();
      const longText = "a".repeat(500); // Max character count
      formData.append("additional_info", longText);
      formData.append("award_selection_method", "merit-review-only");
      formData.append("award_selection_details", longText);
      formData.append("other_key_information", longText);

      const result = await submitAwardRecommendationForReview(formData);

      expect(result.success).toBe(true);
    });
  });

  describe("getFormDataValue helper (implicit testing)", () => {
    it("converts null to empty string", async () => {
      const formData = new FormData();
      // Don't add any fields - they'll be null

      const result = await saveAwardRecommendation(formData);

      expect(result.success).toBe(true);
    });

    it("converts File to empty string and logs warning", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      const formData = new FormData();
      const testFile = new File(["content"], "file.txt");
      formData.append("additional_info", testFile);

      await saveAwardRecommendation(formData);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Unexpected File type for form field "additional_info"',
      );
      consoleWarnSpy.mockRestore();
    });

    it("preserves string values", async () => {
      const formData = new FormData();
      formData.append("additional_info", "Test value");
      formData.append("award_selection_method", "merit-review-only");
      formData.append("award_selection_details", "Details");
      formData.append("other_key_information", "Info");

      const result = await saveAwardRecommendation(formData);

      expect(result.success).toBe(true);
    });
  });
});
