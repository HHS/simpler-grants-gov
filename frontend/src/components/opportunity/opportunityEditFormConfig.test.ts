import { buildOpportunitySummaryUpdateRequest } from "./opportunityEditFormConfig";

function makeFormData(fields: Record<string, string | string[]>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      value.forEach((v) => formData.append(key, v));
    } else {
      formData.append(key, value);
    }
  }
  return formData;
}

describe("buildOpportunitySummaryUpdateRequest", () => {
  describe("stringToNullableNumber fields", () => {
    it("parses a valid integer", () => {
      const result = buildOpportunitySummaryUpdateRequest(
        makeFormData({ expectedNumberOfAwards: "5" }),
      );
      expect(result.expected_number_of_awards).toBe(5);
    });

    it("parses a number with commas", () => {
      const result = buildOpportunitySummaryUpdateRequest(
        makeFormData({ estimatedTotalProgramFunding: "1,000,000" }),
      );
      expect(result.estimated_total_program_funding).toBe(1000000);
    });

    it("returns null for an empty string", () => {
      const result = buildOpportunitySummaryUpdateRequest(
        makeFormData({ awardMinimum: "" }),
      );
      expect(result.award_floor).toBeNull();
    });

    it("returns null for a whitespace-only string", () => {
      const result = buildOpportunitySummaryUpdateRequest(
        makeFormData({ awardMaximum: "   " }),
      );
      expect(result.award_ceiling).toBeNull();
    });

    it("returns null for a non-numeric string", () => {
      const result = buildOpportunitySummaryUpdateRequest(
        makeFormData({ expectedNumberOfAwards: "abc" }),
      );
      expect(result.expected_number_of_awards).toBeNull();
    });

    it("returns null when field is absent", () => {
      const result = buildOpportunitySummaryUpdateRequest(new FormData());
      expect(result.expected_number_of_awards).toBeNull();
    });
  });

  describe("getMultiValueField fields", () => {
    it("returns values from the funding-category-values field", () => {
      const result = buildOpportunitySummaryUpdateRequest(
        makeFormData({ "funding-category-values": ["education", "health"] }),
      );
      expect(result.funding_categories).toEqual(["education", "health"]);
    });

    it("returns values from the funding-type-values field", () => {
      const result = buildOpportunitySummaryUpdateRequest(
        makeFormData({
          "funding-type-values": ["grant", "cooperative_agreement"],
        }),
      );
      expect(result.funding_instruments).toEqual([
        "grant",
        "cooperative_agreement",
      ]);
    });

    it("filters out blank values", () => {
      const result = buildOpportunitySummaryUpdateRequest(
        makeFormData({
          "funding-type-values": ["grant", "  ", "cooperative_agreement"],
        }),
      );
      expect(result.funding_instruments).toEqual([
        "grant",
        "cooperative_agreement",
      ]);
    });

    it("returns an empty array when field is absent", () => {
      const result = buildOpportunitySummaryUpdateRequest(new FormData());
      expect(result.funding_categories).toEqual([]);
    });

    it("supports multiple eligible applicants via eligibleApplicants field", () => {
      const result = buildOpportunitySummaryUpdateRequest(
        makeFormData({
          eligibleApplicants: ["individuals", "state_governments"],
        }),
      );
      expect(result.applicant_types).toEqual([
        "individuals",
        "state_governments",
      ]);
    });
  });

  describe("is_cost_sharing", () => {
    it("returns true when value is 'true'", () => {
      const result = buildOpportunitySummaryUpdateRequest(
        makeFormData({ costSharing: "true" }),
      );
      expect(result.is_cost_sharing).toBe(true);
    });

    it("returns false when value is 'false'", () => {
      const result = buildOpportunitySummaryUpdateRequest(
        makeFormData({ costSharing: "false" }),
      );
      expect(result.is_cost_sharing).toBe(false);
    });

    it("returns null when field is absent", () => {
      const result = buildOpportunitySummaryUpdateRequest(new FormData());
      expect(result.is_cost_sharing).toBeNull();
    });
  });

  describe("emptyToNull string fields", () => {
    it("returns the value for a non-empty string", () => {
      const result = buildOpportunitySummaryUpdateRequest(
        makeFormData({ description: "Some description" }),
      );
      expect(result.summary_description).toBe("Some description");
    });

    it("returns null for an empty string", () => {
      const result = buildOpportunitySummaryUpdateRequest(
        makeFormData({ description: "" }),
      );
      expect(result.summary_description).toBeNull();
    });

    it("returns null for a whitespace-only string", () => {
      const result = buildOpportunitySummaryUpdateRequest(
        makeFormData({ description: "   " }),
      );
      expect(result.summary_description).toBeNull();
    });
  });
});
