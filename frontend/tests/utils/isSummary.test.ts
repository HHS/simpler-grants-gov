import { Summary } from "../../src/types/opportunity/opportunityResponseTypes";
import { isSummary } from "../../src/utils/opportunity/isSummary";

describe("isSummary", () => {
  it("should return true for a valid Summary object", () => {
    const validSummary: Summary = {
      additional_info_url: "https://example.com",
      additional_info_url_description: "Click for more info",
      agency_code: "AGENCY123",
      agency_contact_description: "Contact Description",
      agency_email_address: "contact@example.com",
      agency_email_address_description: "Email the agency",
      agency_name: "Agency Name",
      agency_phone_number: "123-456-7890",
      applicant_eligibility_description: "Eligibility Description",
      applicant_types: ["type1", "type2"],
      archive_date: "2024-12-31",
      award_ceiling: 100000,
      award_floor: 5000,
      close_date: "2024-11-30",
      close_date_description: "Closing Date Description",
      estimated_total_program_funding: 1000000,
      expected_number_of_awards: 5,
      fiscal_year: 2024,
      forecasted_award_date: "2024-10-01",
      forecasted_close_date: "2024-09-30",
      forecasted_close_date_description: "Forecasted Close Date Description",
      forecasted_post_date: "2024-08-01",
      forecasted_project_start_date: "2024-07-01",
      funding_categories: ["category1"],
      funding_category_description: "Funding Category Description",
      funding_instruments: ["instrument1"],
      is_cost_sharing: true,
      is_forecast: false,
      post_date: "2024-06-01",
      summary_description: "This is a summary description",
    };

    expect(isSummary(validSummary)).toBe(true);
  });

  it("should return false for an invalid Summary object", () => {
    const invalidSummary = {
      some_other_field: "Some value",
    };

    expect(isSummary(invalidSummary)).toBe(false);
  });

  it("should return false for null or undefined", () => {
    expect(isSummary(null)).toBe(false);
    expect(isSummary(undefined)).toBe(false);
  });

  it("should return false for non-object types", () => {
    expect(isSummary("string")).toBe(false);
    expect(isSummary(123)).toBe(false);
    expect(isSummary(true)).toBe(false);
  });
});
