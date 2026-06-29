import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import {
  buildOpportunityEditInitialValues,
  buildOpportunitySummaryUpdateRequest,
} from "./opportunityEditFormConfig";

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

function makeOpportunity(
  summaryOverrides: Partial<OpportunityDetail["summary"]> = {},
  opportunityOverrides: Partial<OpportunityDetail> = {},
): OpportunityDetail {
  return {
    opportunity_id: "opp-1",
    legacy_opportunity_id: 1,
    opportunity_status: "posted",
    opportunity_title: "Test Opportunity",
    opportunity_number: "OPP-001",
    category: "discretionary",
    category_explanation: null,
    agency_code: "TEST",
    agency_name: "Test Agency",
    top_level_agency_name: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    is_draft: true,
    is_simpler_grants_opportunity: true,
    opportunity_assistance_listings: [],
    attachments: [],
    competitions: null,
    saved_to_organizations: [],
    submitted_application_count: 0,
    summary: {
      close_date: "2026-06-01",
      is_forecast: false,
      post_date: "2026-05-01",
      additional_info_url: "https://example.com",
      additional_info_url_description: "More info",
      agency_code: "TEST",
      agency_contact_description: "Contact us",
      agency_email_address: "test@example.com",
      agency_email_address_description: "Email us",
      agency_name: "Test Agency",
      agency_phone_number: null,
      applicant_eligibility_description: "Open to all",
      applicant_types: ["individuals"],
      archive_date: null,
      award_ceiling: 100000,
      award_floor: 1000,
      close_date_description: null,
      estimated_total_program_funding: 500000,
      expected_number_of_awards: 5,
      fiscal_year: null,
      forecasted_award_date: null,
      forecasted_close_date: null,
      forecasted_close_date_description: null,
      forecasted_post_date: null,
      forecasted_project_start_date: null,
      funding_categories: ["education"],
      funding_category_description: null,
      funding_instruments: ["grant"],
      is_cost_sharing: true,
      summary_description: "A test description",
      updated_at: "2026-01-01",
      version_number: 1,
      ...summaryOverrides,
    },
    ...opportunityOverrides,
  };
}

describe("buildOpportunityEditInitialValues", () => {
  it("maps opportunity and summary fields to form values", () => {
    const result = buildOpportunityEditInitialValues(makeOpportunity());

    expect(result.title).toBe("Test Opportunity");
    expect(result.awardSelectionMethod).toBe("discretionary");
    expect(result.description).toBe("A test description");
    expect(result.fundingType).toBe("grant");
    expect(result.fundingCategories).toBe("education");
    expect(result.awardMinimum).toBe("1000");
    expect(result.awardMaximum).toBe("100000");
    expect(result.estimatedTotalProgramFunding).toBe("500000");
    expect(result.expectedNumberOfAwards).toBe("5");
    expect(result.eligibleApplicants).toEqual(["individuals"]);
    expect(result.costSharing).toBe(true);
    expect(result.publishDate).toBe("2026-05-01");
    expect(result.closeDate).toBe("2026-06-01");
    expect(result.contactEmail).toBe("test@example.com");
  });

  it("returns empty string for null numeric summary fields (numberToString null branch)", () => {
    const result = buildOpportunityEditInitialValues(
      makeOpportunity({
        award_floor: null,
        award_ceiling: null,
        estimated_total_program_funding: null,
        expected_number_of_awards: null,
      }),
    );

    expect(result.awardMinimum).toBe("");
    expect(result.awardMaximum).toBe("");
    expect(result.estimatedTotalProgramFunding).toBe("");
    expect(result.expectedNumberOfAwards).toBe("");
  });

  it("falls back to empty string when opportunity_title is null", () => {
    const result = buildOpportunityEditInitialValues(
      makeOpportunity({}, { opportunity_title: null }),
    );

    expect(result.title).toBe("");
  });

  it("returns empty string when funding_instruments array is empty", () => {
    const result = buildOpportunityEditInitialValues(
      makeOpportunity({ funding_instruments: [] }),
    );

    expect(result.fundingType).toBe("");
  });

  it("returns empty string when funding_instruments is null", () => {
    const result = buildOpportunityEditInitialValues(
      makeOpportunity({ funding_instruments: null }),
    );

    expect(result.fundingType).toBe("");
  });

  it("returns empty array when applicant_types is null", () => {
    const result = buildOpportunityEditInitialValues(
      makeOpportunity({ applicant_types: null }),
    );

    expect(result.eligibleApplicants).toEqual([]);
  });

  it("returns empty string when funding_categories is empty", () => {
    const result = buildOpportunityEditInitialValues(
      makeOpportunity({ funding_categories: [] }),
    );

    expect(result.fundingCategories).toBe("");
  });
});

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

    it("falls back to eligible-applicants-values when eligibleApplicants is empty", () => {
      const result = buildOpportunitySummaryUpdateRequest(
        makeFormData({
          "eligible-applicants-values": ["state_governments"],
        }),
      );
      expect(result.applicant_types).toEqual(["state_governments"]);
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
