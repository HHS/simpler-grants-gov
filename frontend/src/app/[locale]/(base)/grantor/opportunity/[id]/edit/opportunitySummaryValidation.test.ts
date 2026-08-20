import { OpportunitySummaryCreateRequestV1Schema } from "src/validation-schemas/apiSchemas.zod";

import {
  getOpportunitySummaryValidationData,
  toOpportunitySummaryRequest,
} from "./opportunitySummaryValidation";

const validOpportunitySummaryData = {
  opportunity_title: "Example",
  summary_description: "Example summary",
  funding_instruments: ["grant"],
  funding_categories: ["education"],
  applicant_types: ["state_governments"],
  post_date: "2026-08-19",

  is_cost_sharing: false,
  award_floor: 0,
  award_ceiling: 1000,

  agency_contact_description: "Contact description",
  agency_email_address: "test@example.com",
  agency_email_address_description: "Contact email",

  is_forecast: false,

  close_date: null,
  close_date_description: null,
  expected_number_of_awards: null,
  estimated_total_program_funding: null,
  additional_info_url: null,
  additional_info_url_description: null,
  funding_category_description: null,
  applicant_eligibility_description: null,
};

it("converts undefined optional fields to null", () => {
  const parsed = OpportunitySummaryCreateRequestV1Schema.parse({
    ...validOpportunitySummaryData,

    close_date: undefined,
    close_date_description: undefined,
    expected_number_of_awards: undefined,
    estimated_total_program_funding: undefined,
    additional_info_url: undefined,
    additional_info_url_description: undefined,
    funding_category_description: undefined,
    applicant_eligibility_description: undefined,
  });

  const result = toOpportunitySummaryRequest(parsed);

  expect(result.close_date).toBeNull();
  expect(result.close_date_description).toBeNull();
  expect(result.expected_number_of_awards).toBeNull();
  expect(result.estimated_total_program_funding).toBeNull();
  expect(result.additional_info_url).toBeNull();
  expect(result.additional_info_url_description).toBeNull();
  expect(result.funding_category_description).toBeNull();
  expect(result.applicant_eligibility_description).toBeNull();
});

describe("getOpportunitySummaryValidationData", () => {
  it("normalizes ordinary fields using the generated Zod schema", () => {
    const formData = new FormData();

    formData.set("expected_number_of_awards", "10");
    formData.set("is_cost_sharing", "true");

    const result = getOpportunitySummaryValidationData(formData);

    expect(result.expected_number_of_awards).toBe(10);
    expect(result.is_cost_sharing).toBe(true);
  });

  it("collects applicant_types array values from indexed FormData fields", () => {
    const formData = new FormData();

    formData.set("applicant_types[0]", "state_governments");
    formData.set("applicant_types[1]", "nonprofits");

    const result = getOpportunitySummaryValidationData(formData);

    expect(result.applicant_types).toEqual(["state_governments", "nonprofits"]);
  });

  it("wraps funding category in an array", () => {
    const formData = new FormData();

    formData.set("funding_categories", "education");

    const result = getOpportunitySummaryValidationData(formData);

    expect(result.funding_categories).toEqual(["education"]);
  });

  it("returns an empty funding category array when no value is selected", () => {
    const formData = new FormData();

    const result = getOpportunitySummaryValidationData(formData);

    expect(result.funding_categories).toEqual([]);
  });

  it("wraps funding instrument in an array", () => {
    const formData = new FormData();

    formData.set("funding_instruments", "grant");

    const result = getOpportunitySummaryValidationData(formData);

    expect(result.funding_instruments).toEqual(["grant"]);
  });

  it("returns an empty funding instrument array when no value is selected", () => {
    const formData = new FormData();

    const result = getOpportunitySummaryValidationData(formData);

    expect(result.funding_instruments).toEqual([]);
  });

  it("applies overrides after FormData normalization", () => {
    const formData = new FormData();

    formData.set("post_date", "08/01/2026");
    formData.set("close_date", "08/31/2026");

    const result = getOpportunitySummaryValidationData(formData, {
      post_date: "2026-08-05",
      close_date: "2026-09-01",
    });

    expect(result.post_date).toBe("2026-08-05");
    expect(result.close_date).toBe("2026-09-01");
  });

  it("allows nullable override values", () => {
    const formData = new FormData();

    formData.set("close_date", "08/31/2026");

    const result = getOpportunitySummaryValidationData(formData, {
      close_date: null,
    });

    expect(result.close_date).toBeNull();
  });
});

describe("toOpportunitySummaryRequest", () => {
  it("converts undefined optional fields to null", () => {
    const parsed = OpportunitySummaryCreateRequestV1Schema.parse({
      ...validOpportunitySummaryData,

      opportunity_title: "Example",
      funding_instruments: ["grant"],
      funding_categories: ["education"],
      applicant_types: ["state_governments"],
      post_date: "2026-08-19",

      close_date: undefined,
      close_date_description: undefined,
      expected_number_of_awards: undefined,
      estimated_total_program_funding: undefined,
      additional_info_url: undefined,
      additional_info_url_description: undefined,
      funding_category_description: undefined,
      applicant_eligibility_description: undefined,
    });

    const result = toOpportunitySummaryRequest(parsed);

    expect(result.close_date).toBeNull();
    expect(result.close_date_description).toBeNull();
    expect(result.expected_number_of_awards).toBeNull();
    expect(result.estimated_total_program_funding).toBeNull();
    expect(result.additional_info_url).toBeNull();
    expect(result.additional_info_url_description).toBeNull();
    expect(result.funding_category_description).toBeNull();
    expect(result.applicant_eligibility_description).toBeNull();
  });

  it("preserves populated optional values", () => {
    const parsed = OpportunitySummaryCreateRequestV1Schema.parse({
      ...validOpportunitySummaryData,

      close_date: "2026-09-01",
      close_date_description: "Applications close September 1.",
      expected_number_of_awards: 10,
      estimated_total_program_funding: 1_000_000,
      additional_info_url: "https://example.com",
      additional_info_url_description: "Additional information",
      funding_category_description: "Funding category details",
      applicant_eligibility_description: "Eligibility details",
    });

    const result = toOpportunitySummaryRequest(parsed);

    expect(result.close_date).toBe("2026-09-01");
    expect(result.close_date_description).toBe(
      "Applications close September 1.",
    );
    expect(result.expected_number_of_awards).toBe(10);
    expect(result.estimated_total_program_funding).toBe(1_000_000);
    expect(result.additional_info_url).toBe("https://example.com");
    expect(result.additional_info_url_description).toBe(
      "Additional information",
    );
    expect(result.funding_category_description).toBe(
      "Funding category details",
    );
    expect(result.applicant_eligibility_description).toBe(
      "Eligibility details",
    );
  });
});
