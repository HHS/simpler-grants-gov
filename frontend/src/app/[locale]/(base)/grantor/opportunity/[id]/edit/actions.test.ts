import { identity } from "lodash";
import { ApiRequestError } from "src/errors";
import {
  createOpportunitySummaryForGrantor,
  updateOpportunitySummaryForGrantor,
} from "src/services/fetch/fetchers/opportunitySummaryGrantorFetcher";
import { buildOpportunitySummaryUpdateRequest } from "src/utils/opportunityEditFormConfig";

import {
  opportunityEditFormAction,
  saveOpportunityEditAction,
  type OpportunityEditActionState,
} from "./actions";

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
}));

jest.mock(
  "src/services/fetch/fetchers/opportunitySummaryGrantorFetcher",
  () => ({
    createOpportunitySummaryForGrantor: jest.fn(),
    updateOpportunitySummaryForGrantor: jest.fn(),
  }),
);

const mockRedirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (url: string): void => {
    mockRedirect(url);
  },
}));

const initialState: OpportunityEditActionState = {
  validationErrors: {},
};

const mockCreateOpportunitySummaryForGrantor = jest.mocked(
  createOpportunitySummaryForGrantor,
);
const mockUpdateOpportunitySummaryForGrantor = jest.mocked(
  updateOpportunitySummaryForGrantor,
);

const successfulSummaryUpdateResponse: Awaited<
  ReturnType<typeof updateOpportunitySummaryForGrantor>
> = {
  message: "success",
  status_code: 200,
  data: {
    opportunity_summary_id: "sum-456",
    is_forecast: false,
    summary_description: "Summary text",
    is_cost_sharing: null,
    post_date: "2026-03-11",
    close_date: "2026-04-11",
    close_date_description: null,
    archive_date: null,
    updated_at: "2026-03-11T00:00:00Z",
    expected_number_of_awards: null,
    estimated_total_program_funding: null,
    award_floor: null,
    award_ceiling: null,
    additional_info_url: null,
    additional_info_url_description: null,
    funding_categories: [],
    funding_category_description: null,
    funding_instruments: [],
    applicant_types: [],
    applicant_eligibility_description: null,
    agency_code: null,
    agency_contact_description: null,
    agency_email_address: "grants@example.com",
    agency_email_address_description: null,
    agency_name: null,
    agency_phone_number: null,
    forecasted_post_date: null,
    forecasted_close_date: null,
    forecasted_close_date_description: null,
    forecasted_award_date: null,
    forecasted_project_start_date: null,
    fiscal_year: null,
    version_number: null,
  },
};

function buildValidFormData() {
  const formData = new FormData();
  formData.set("opportunityId", "opp-123");
  formData.set("title", "Example opportunity");
  formData.set("awardSelectionMethod", "discretionary");
  formData.set("description", "Summary text");
  formData.set("publishDate", "2026-03-11");
  formData.set("closeDate", "2026-04-11");
  formData.set("contactEmail", "grants@example.com");
  formData.set("funding-type-values", "grant");
  formData.set("funding-category-values", "health");
  formData.set("expectedNumberOfAwards", "5");
  formData.set("estimatedTotalProgramFunding", "100000");
  formData.set("awardMinimum", "1000");
  formData.set("awardMaximum", "5000");
  formData.append("eligibleApplicants", "state_governments");
  formData.set("additionalEligibilityInfo", "Must be US-based");
  formData.set("additionalInfoUrl", "https://example.com");
  formData.set("additionalInfoUrlText", "More info");
  formData.set("grantorContactDetails", "Program office");
  formData.set("contactEmailText", "Email us");

  return formData;
}

describe("saveOpportunityEditAction", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns validation errors only for API-required fields when form is empty", async () => {
    const formData = new FormData();
    formData.set("opportunityId", "opp-123");

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result.validationErrors).toEqual({
      publishDate: ["publishDate"],
      fundingType: ["fundingType"],
      fundingCategory: ["fundingCategory"],
      eligibleApplicants: ["eligibleApplicants"],
    });
  });

  it("returns only the format error for a non-empty invalid email", async () => {
    const formData = buildValidFormData();
    formData.set("contactEmail", "not-an-email");

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result.validationErrors).toEqual({
      contactEmail: ["contactEmailInvalid"],
    });
  });

  it("returns an award maximum error when award minimum exceeds award maximum", async () => {
    const formData = buildValidFormData();
    formData.set("awardMinimum", "5000");
    formData.set("awardMaximum", "1000");

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result.validationErrors).toEqual({
      awardMinimum: ["awardMinLessThanMax"],
      awardMaximum: ["awardMaxGreaterThanMin"],
    });
  });

  it("returns exceedTotalFunding error when award min or max exceeds the total funding", async () => {
    const formData = buildValidFormData();
    formData.set("estimatedTotalProgramFunding", "1000");
    formData.set("awardMinimum", "5000");
    formData.set("awardMaximum", "6000");

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result.validationErrors).toEqual({
      awardMinimum: ["awardMinLessThanTotal"],
      awardMaximum: ["awardMaxLessThanTotal"],
    });
  });

  it("returns a close date error when close date is before publish date", async () => {
    const formData = buildValidFormData();
    formData.set("publishDate", "2026-04-11");
    formData.set("closeDate", "2026-03-11");

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result.validationErrors).toEqual({
      closeDate: ["closeDateOrder"],
    });
  });

  it("maps an unparseable publishDate to a closeDateOrder error (format failure)", async () => {
    const formData = buildValidFormData();
    formData.set("publishDate", "not-a-date");

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result.validationErrors).toEqual({
      closeDate: ["closeDateOrder"],
    });
  });

  it("maps an unparseable closeDate to a closeDateOrder error (format failure)", async () => {
    const formData = buildValidFormData();
    formData.set("closeDate", "not-a-date");

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result.validationErrors).toEqual({
      closeDate: ["closeDateOrder"],
    });
  });

  it("returns an error when opportunityId is missing", async () => {
    const formData = buildValidFormData();
    formData.delete("opportunityId"); // summary context is missing

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result).toEqual({
      errorMessage: "missingSummaryContext",
    });
  });

  it("calls the summary create fetcher when no opportunitySummaryId and returns new summary ID", async () => {
    const formData = buildValidFormData();
    formData.set("opportunityId", "opp-123");
    formData.set("isForecast", "true");
    // opportunitySummaryId not set

    const createResponse: Awaited<
      ReturnType<typeof createOpportunitySummaryForGrantor>
    > = {
      message: "success",
      status_code: 201,
      data: {
        opportunity_summary_id: "new-sum-789",
        is_forecast: true,
        summary_description: "Summary text",
        is_cost_sharing: null,
        post_date: "2026-03-11",
        close_date: "2026-04-11",
        close_date_description: null,
        archive_date: null,
        updated_at: "2026-03-11T00:00:00Z",
        expected_number_of_awards: null,
        estimated_total_program_funding: null,
        award_floor: null,
        award_ceiling: null,
        additional_info_url: null,
        additional_info_url_description: null,
        funding_categories: [],
        funding_category_description: null,
        funding_instruments: [],
        applicant_types: [],
        applicant_eligibility_description: null,
        agency_code: null,
        agency_contact_description: null,
        agency_email_address: "grants@example.com",
        agency_email_address_description: null,
        agency_name: null,
        agency_phone_number: null,
        forecasted_post_date: null,
        forecasted_close_date: null,
        forecasted_close_date_description: null,
        forecasted_award_date: null,
        forecasted_project_start_date: null,
        fiscal_year: null,
        version_number: null,
      },
    };

    mockCreateOpportunitySummaryForGrantor.mockResolvedValue(createResponse);

    const result = await saveOpportunityEditAction(initialState, formData);

    const firstCall = mockCreateOpportunitySummaryForGrantor.mock.calls[0];
    expect(firstCall).toBeDefined();
    expect(firstCall?.[0].opportunityId).toBe("opp-123");
    expect(firstCall?.[0].body.is_forecast).toBe(true);
    expect(firstCall?.[0].body.summary_description).toBe("Summary text");
    expect(result).toEqual({
      successMessage: "success",
      newOpportunitySummaryId: "new-sum-789",
    });
  });

  it("calls the summary update fetcher and returns success", async () => {
    const formData = buildValidFormData();
    formData.set("opportunityId", "opp-123");
    formData.set("opportunitySummaryId", "sum-456");

    mockUpdateOpportunitySummaryForGrantor.mockResolvedValue(
      successfulSummaryUpdateResponse,
    );

    const result = await saveOpportunityEditAction(initialState, formData);

    const firstCall = mockUpdateOpportunitySummaryForGrantor.mock.calls[0];

    expect(firstCall).toBeDefined();
    expect(firstCall?.[0].opportunityId).toBe("opp-123");
    expect(firstCall?.[0].opportunitySummaryId).toBe("sum-456");
    expect(firstCall?.[0].body.summary_description).toBe("Summary text");
    expect(firstCall?.[0].body.post_date).toBe("2026-03-11");
    expect(firstCall?.[0].body.close_date).toBe("2026-04-11");
    expect(firstCall?.[0].body.agency_email_address).toBe("grants@example.com");
    expect(result).toEqual({
      successMessage: "success",
    });
  });

  it("maps 403 to a permission error", async () => {
    const formData = buildValidFormData();
    formData.set("opportunityId", "opp-123");
    formData.set("opportunitySummaryId", "sum-456");

    mockUpdateOpportunitySummaryForGrantor.mockRejectedValue(
      new ApiRequestError("forbidden", "APIRequestError", 403),
    );

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result).toEqual({
      errorMessage: "forbidden",
    });
  });

  it("maps 404 to a not found error", async () => {
    const formData = buildValidFormData();
    formData.set("opportunityId", "opp-123");
    formData.set("opportunitySummaryId", "sum-456");

    mockUpdateOpportunitySummaryForGrantor.mockRejectedValue(
      new ApiRequestError("missing", "APIRequestError", 404),
    );

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result).toEqual({
      errorMessage: "notFound",
    });
  });

  it("maps 422 to a draft-state error", async () => {
    const formData = buildValidFormData();
    formData.set("opportunityId", "opp-123");
    formData.set("opportunitySummaryId", "sum-456");

    mockUpdateOpportunitySummaryForGrantor.mockRejectedValue(
      new ApiRequestError("invalid", "APIRequestError", 422),
    );

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result).toEqual({
      errorMessage: "draftOnly",
    });
  });

  it("maps 401 to an unauthenticated error", async () => {
    const formData = buildValidFormData();
    formData.set("opportunityId", "opp-123");
    formData.set("opportunitySummaryId", "sum-456");

    mockUpdateOpportunitySummaryForGrantor.mockRejectedValue(
      new ApiRequestError("unauthenticated", "APIRequestError", 401),
    );

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result).toEqual({
      errorMessage: "unauthenticated",
    });
  });

  it("maps unknown failures to a generic save error", async () => {
    const formData = buildValidFormData();
    formData.set("opportunityId", "opp-123");
    formData.set("opportunitySummaryId", "sum-456");

    mockUpdateOpportunitySummaryForGrantor.mockRejectedValue(
      new Error("unexpected"),
    );

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result).toEqual({
      errorMessage: "genericError",
    });
  });
});

describe("buildOpportunitySummaryUpdateRequest", () => {
  it("maps current edit form fields into the summary update payload", () => {
    const formData = new FormData();
    formData.set("description", "Summary text");
    formData.set("publishDate", "2026-03-11");
    formData.set("closeDate", "2026-04-11");
    formData.set("closeDateExplanation", "Rolling deadline");
    formData.set("expectedNumberOfAwards", "12");
    formData.set("estimatedTotalProgramFunding", "150000");
    formData.set("awardMinimum", "1000");
    formData.set("awardMaximum", "5000");
    formData.set("additionalInfoUrl", "https://example.com");
    formData.set("additionalInfoUrlText", "More info");
    formData.set("funding-category-values", "health");
    formData.set("fundingCategoryExplanation", "Other category notes");
    formData.set("funding-type-values", "grant");
    formData.set("costSharing", "true");
    formData.append("eligibleApplicants", "small_businesses");
    formData.append("eligibleApplicants", "state_governments");
    formData.set("additionalEligibilityInfo", "Must be US-based");
    formData.set("grantorContactDetails", "Program office");
    formData.set("contactEmail", "grants@example.com");
    formData.set("contactEmailText", "Email us");

    expect(buildOpportunitySummaryUpdateRequest(formData)).toEqual({
      is_cost_sharing: true,
      summary_description: "Summary text",
      post_date: "2026-03-11",
      close_date: "2026-04-11",
      close_date_description: "Rolling deadline",
      expected_number_of_awards: 12,
      estimated_total_program_funding: 150000,
      award_floor: 1000,
      award_ceiling: 5000,
      additional_info_url: "https://example.com",
      additional_info_url_description: "More info",
      funding_categories: ["health"],
      funding_category_description: "Other category notes",
      funding_instruments: ["grant"],
      applicant_types: ["small_businesses", "state_governments"],
      applicant_eligibility_description: "Must be US-based",
      agency_contact_description: "Program office",
      agency_email_address: "grants@example.com",
      agency_email_address_description: "Email us",
    });
  });
});

describe("opportunityEditFormAction", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("delegates to saveOpportunityEditAction and redirects to the overview page when submitType = saveAndExit", async () => {
    const formData = buildValidFormData();
    formData.set("opportunityId", "opp-123");
    formData.set("opportunitySummaryId", "sum-456");
    formData.set("submitType", "saveAndExit");

    mockUpdateOpportunitySummaryForGrantor.mockResolvedValue(
      successfulSummaryUpdateResponse,
    );

    await opportunityEditFormAction(initialState, formData);

    expect(mockUpdateOpportunitySummaryForGrantor).toHaveBeenCalledTimes(1);
    expect(mockRedirect).toHaveBeenCalledWith("../overview");
  });

  it("delegates to saveOpportunityEditAction and redirects to the overview page when submitType = saveAndGoBack", async () => {
    const formData = buildValidFormData();
    formData.set("opportunityId", "opp-123");
    formData.set("opportunitySummaryId", "sum-456");
    formData.set("submitType", "saveAndGoBack");

    mockUpdateOpportunitySummaryForGrantor.mockResolvedValue(
      successfulSummaryUpdateResponse,
    );

    await opportunityEditFormAction(initialState, formData);

    expect(mockUpdateOpportunitySummaryForGrantor).toHaveBeenCalledTimes(1);
    expect(mockRedirect).toHaveBeenCalledWith("../overview");
  });

  it("delegates to saveOpportunityEditAction and redirects to the competition page when submitType = saveAndContinue", async () => {
    const formData = buildValidFormData();
    formData.set("opportunityId", "opp-123");
    formData.set("opportunitySummaryId", "sum-456");
    formData.set("submitType", "saveAndContinue");

    mockUpdateOpportunitySummaryForGrantor.mockResolvedValue(
      successfulSummaryUpdateResponse,
    );

    await opportunityEditFormAction(initialState, formData);

    expect(mockUpdateOpportunitySummaryForGrantor).toHaveBeenCalledTimes(1);
    expect(mockRedirect).toHaveBeenCalledWith("../competition");
  });

  it("delegates to saveOpportunityEditAction and returns success when submitType none of three expected", async () => {
    const formData = buildValidFormData();
    formData.set("opportunityId", "opp-123");
    formData.set("opportunitySummaryId", "sum-456");
    formData.set("submitType", "save");

    mockUpdateOpportunitySummaryForGrantor.mockResolvedValue(
      successfulSummaryUpdateResponse,
    );

    const result = await opportunityEditFormAction(initialState, formData);

    expect(mockUpdateOpportunitySummaryForGrantor).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ successMessage: "success" });
  });

  it("delegates to saveOpportunityEditAction and returns errors and does not redirect", async () => {
    const formData = buildValidFormData();
    formData.set("opportunityId", "opp-123");
    formData.set("opportunitySummaryId", "sum-456");
    formData.set("submitType", "saveAndContinue");
    formData.set("contactEmail", "not-an-email");

    mockUpdateOpportunitySummaryForGrantor.mockResolvedValue(
      successfulSummaryUpdateResponse,
    );

    const result = await opportunityEditFormAction(initialState, formData);

    expect(mockUpdateOpportunitySummaryForGrantor).not.toHaveBeenCalledTimes(1);
    expect(mockRedirect).not.toHaveBeenCalledWith("../competition");
    expect(result.validationErrors).toEqual({
      contactEmail: ["contactEmailInvalid"],
    });
  });
});
