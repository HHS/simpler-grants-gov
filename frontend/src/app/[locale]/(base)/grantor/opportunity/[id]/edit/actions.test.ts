import { identity } from "lodash";
import { ApiRequestError } from "src/errors";
import {
  createOpportunitySummaryForGrantor,
  updateOpportunitySummaryForGrantor,
} from "src/services/fetch/fetchers/grantorOpportunitiesFetcher";

import {
  opportunityEditFormAction,
  saveOpportunityEditAction,
  type OpportunityEditActionState,
} from "./actions";

const mockTranslator = Object.assign(
  (key: string) => key,
  {
    has: () => true,
  },
);

jest.mock("next-intl/server", () => ({
  getTranslations: () => mockTranslator,
}));

jest.mock("src/services/fetch/fetchers/grantorOpportunitiesFetcher", () => ({
  createOpportunitySummaryForGrantor: jest.fn(),
  updateOpportunitySummaryForGrantor: jest.fn(),
}));

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
  formData.set("opportunity_id", "opp-123");
  formData.set("is_forecast", "false");
  formData.set("opportunity_title", "Example opportunity");
  formData.set("category", "discretionary");
  formData.set("summary_description", "Summary text");
  formData.set("post_date", "2026-03-11");
  formData.set("close_date", "2026-04-11");
  formData.set("agency_email_address", "grants@example.com");
  formData.set("funding_instruments", "grant");
  formData.set("funding_categories", "health");
  formData.set("expected_number_of_awards", "5");
  formData.set("estimated_total_program_funding", "100000");
  formData.set("award_floor", "1000");
  formData.set("award_ceiling", "5000");
  formData.set("applicant_types[0]", "state_governments");
  formData.set("applicant_eligibility_description", "Must be US-based");
  formData.set("additional_info_url", "https://example.com");
  formData.set("additional_info_url_description", "More info");
  formData.set("agency_contact_description", "Program office");
  formData.set("agency_email_address_description", "Email us");

  return formData;
}

describe("saveOpportunityEditAction", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns validation errors only for API-required fields when form is empty", async () => {
    const formData = new FormData();
    formData.set("opportunity_id", "opp-123");

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result.validationErrors).toEqual({
      post_date: ["post_date.required"],
      funding_instruments: ["fundingType"],
      funding_categories: ["fundingCategory"],
      applicant_types: ["applicant_types.min_or_max_value"],
    });
  });

  it("returns only the format error for a non-empty invalid email", async () => {
    const formData = buildValidFormData();
    formData.set("agency_email_address", "not-an-email");

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result.validationErrors).toEqual({
      agency_email_address: ["agency_email_address.invalid"],
    });
  });

  it("returns an award maximum error when award minimum exceeds award maximum", async () => {
    const formData = buildValidFormData();
    formData.set("award_floor", "5000");
    formData.set("award_ceiling", "1000");

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result.validationErrors).toEqual({
      award_floor: ["awardMinLessThanMax"],
      award_ceiling: ["awardMaxGreaterThanMin"],
    });
  });

  it("returns exceedTotalFunding error when award min or max exceeds the total funding", async () => {
    const formData = buildValidFormData();
    formData.set("estimated_total_program_funding", "1000");
    formData.set("award_floor", "5000");
    formData.set("award_ceiling", "6000");

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result.validationErrors).toEqual({
      award_floor: ["awardMinLessThanTotal"],
      award_ceiling: ["awardMaxLessThanTotal"],
    });
  });

  it("returns a close date error when close date is before publish date", async () => {
    const formData = buildValidFormData();
    formData.set("post_date", "2026-04-11");
    formData.set("close_date", "2026-03-11");

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result.validationErrors).toEqual({
      closeDate: ["closeDateOrder"],
    });
  });

  it("maps an unparseable post_date to a closeDateOrder error (format failure)", async () => {
    const formData = buildValidFormData();
    formData.set("post_date", "not-a-date");

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result.validationErrors).toEqual({
      closeDate: ["closeDateOrder"],
    });
  });

  it("maps an unparseable close_date to a closeDateOrder error (format failure)", async () => {
    const formData = buildValidFormData();
    formData.set("close_date", "not-a-date");

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result.validationErrors).toEqual({
      closeDate: ["closeDateOrder"],
    });
  });

  it("returns an error when opportunity_id is missing", async () => {
    const formData = buildValidFormData();
    formData.delete("opportunity_id"); // summary context is missing

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result).toEqual({
      errorMessage: "missingSummaryContext",
    });
  });

  it("calls the summary create fetcher when no opportunity_summary_id and returns new summary ID", async () => {
    const formData = buildValidFormData();
    formData.set("opportunity_id", "opp-123");
    formData.set("is_forecast", "true");
    // opportunity_summary_id not set

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
    formData.set("opportunity_id", "opp-123");
    formData.set("opportunity_summary_id", "sum-456");

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
    formData.set("opportunity_id", "opp-123");
    formData.set("opportunity_summary_id", "sum-456");

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
    formData.set("opportunity_id", "opp-123");
    formData.set("opportunity_summary_id", "sum-456");

    mockUpdateOpportunitySummaryForGrantor.mockRejectedValue(
      new ApiRequestError("missing", "APIRequestError", 404),
    );

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result).toEqual({
      errorMessage: "notFound",
    });
  });

  it("maps an unexpected thrown 422 to a generic save error", async () => {
    // A real 422 now resolves via allowedErrorStatuses rather than throwing (see tests
    // below). This covers the defensive fallback if one is ever thrown some other way.
    const formData = buildValidFormData();
    formData.set("opportunity_id", "opp-123");
    formData.set("opportunity_summary_id", "sum-456");

    mockUpdateOpportunitySummaryForGrantor.mockRejectedValue(
      new ApiRequestError("invalid", "APIRequestError", 422),
    );

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result).toEqual({
      errorMessage: "genericError",
    });
  });

  it("maps 422 response field errors to inline validationErrors", async () => {
    const formData = buildValidFormData();
    formData.set("opportunity_id", "opp-123");
    formData.set("opportunity_summary_id", "sum-456");

    mockUpdateOpportunitySummaryForGrantor.mockResolvedValue({
      ...successfulSummaryUpdateResponse,
      status_code: 422,
      errors: [
        {
          field: "award_floor",
          message: "Not a valid integer.",
          type: "invalid",
        },
        {
          field: "award_ceiling",
          message: "Not a valid integer.",
          type: "invalid",
        },
      ],
    });

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result).toEqual({
      validationErrors: {
        award_floor: ["Not a valid integer."],
        award_ceiling: ["Not a valid integer."],
      },
      errorMessage: undefined,
    });
  });

  it("maps 422 response errors with no matching form field to a top-level errorMessage", async () => {
    const formData = buildValidFormData();
    formData.set("opportunity_id", "opp-123");
    formData.set("opportunity_summary_id", "sum-456");

    mockUpdateOpportunitySummaryForGrantor.mockResolvedValue({
      ...successfulSummaryUpdateResponse,
      status_code: 422,
      errors: [
        {
          field: "opportunity_summary_id",
          message: "Only draft opportunity summaries can be updated.",
          type: "invalid",
        },
      ],
    });

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result).toEqual({
      validationErrors: undefined,
      errorMessage: "Only draft opportunity summaries can be updated.",
    });
  });

  it("falls back to the response's top-level message when a 422 has an empty errors array", async () => {
    // Business-rule errors like validate_opportunity_created_in_simpler_grants call
    // raise_flask_error with a message and no validation_issues, so errors comes back
    // empty and the real text lives only in the top-level message.
    const formData = buildValidFormData();
    formData.set("opportunity_id", "opp-123");
    formData.set("opportunity_summary_id", "sum-456");

    mockUpdateOpportunitySummaryForGrantor.mockResolvedValue({
      ...successfulSummaryUpdateResponse,
      status_code: 422,
      message: "Only opportunities created in Simpler Grants can be updated",
      errors: [],
    });

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result).toEqual({
      validationErrors: undefined,
      errorMessage:
        "Only opportunities created in Simpler Grants can be updated",
    });
  });

  it("strips comma-formatted currency fields before sending the update request", async () => {
    const formData = buildValidFormData();
    formData.set("opportunity_id", "opp-123");
    formData.set("opportunity_summary_id", "sum-456");
    formData.set("estimated_total_program_funding", "1,000,000");
    formData.set("award_floor", "100,000");
    formData.set("award_ceiling", "500,000");

    mockUpdateOpportunitySummaryForGrantor.mockResolvedValue(
      successfulSummaryUpdateResponse,
    );

    await saveOpportunityEditAction(initialState, formData);

    const firstCall = mockUpdateOpportunitySummaryForGrantor.mock.calls[0];
    expect(firstCall?.[0].body.estimated_total_program_funding).toBe(1000000);
    expect(firstCall?.[0].body.award_floor).toBe(100000);
    expect(firstCall?.[0].body.award_ceiling).toBe(500000);
  });

  it("strips comma-formatted currency fields before sending the create request", async () => {
    const formData = buildValidFormData();
    formData.set("opportunity_id", "opp-123");
    // opportunity_summary_id not set - takes the create path
    formData.set("estimated_total_program_funding", "1,000,000");
    formData.set("award_floor", "100,000");
    formData.set("award_ceiling", "500,000");

    mockCreateOpportunitySummaryForGrantor.mockResolvedValue({
      message: "success",
      status_code: 201,
      data: { opportunity_summary_id: "new-sum-789" },
    } as unknown as Awaited<
      ReturnType<typeof createOpportunitySummaryForGrantor>
    >);

    await saveOpportunityEditAction(initialState, formData);

    const firstCall = mockCreateOpportunitySummaryForGrantor.mock.calls[0];
    expect(firstCall?.[0].body.estimated_total_program_funding).toBe(1000000);
    expect(firstCall?.[0].body.award_floor).toBe(100000);
    expect(firstCall?.[0].body.award_ceiling).toBe(500000);
  });

  it("maps 401 to an unauthenticated error", async () => {
    const formData = buildValidFormData();
    formData.set("opportunity_id", "opp-123");
    formData.set("opportunity_summary_id", "sum-456");

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
    formData.set("opportunity_id", "opp-123");
    formData.set("opportunity_summary_id", "sum-456");

    mockUpdateOpportunitySummaryForGrantor.mockRejectedValue(
      new Error("unexpected"),
    );

    const result = await saveOpportunityEditAction(initialState, formData);

    expect(result).toEqual({
      errorMessage: "genericError",
    });
  });
});

describe("opportunityEditFormAction", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns validation errors and does not publish when save has validation errors", async () => {
    const formData = new FormData();
    formData.set("opportunity_id", "opp-123");
    formData.set("opportunity_summary_id", "sum-456");
    // post_date missing - triggers validation error

    const result = await opportunityEditFormAction(initialState, formData);

    expect(result.validationErrors).toEqual({
      post_date: ["post_date.required"],
      funding_instruments: ["funding_instruments.min_or_max_value"],
      funding_categories: ["funding_categories.min_or_max_value"],
      applicant_types: ["applicant_types.min_or_max_value"],
    });
    expect(mockUpdateOpportunitySummaryForGrantor).not.toHaveBeenCalled();
  });

  it("returns the publish error when save succeeds but publish fails with 403", async () => {
    const formData = buildValidFormData();
    formData.set("opportunity_id", "opp-123");
    formData.set("opportunity_summary_id", "sum-456");

    mockUpdateOpportunitySummaryForGrantor.mockResolvedValue(
      successfulSummaryUpdateResponse,
    );
    mockUpdateOpportunitySummaryForGrantor.mockRejectedValue(
      new ApiRequestError("forbidden", "APIRequestError", 403),
    );

    const result = await opportunityEditFormAction(initialState, formData);

    expect(result).toEqual({ errorMessage: "forbidden" });
  });

  it("returns the publish error when save succeeds but publish fails with 404", async () => {
    const formData = buildValidFormData();
    formData.set("opportunity_id", "opp-123");
    formData.set("opportunity_summary_id", "sum-456");

    mockUpdateOpportunitySummaryForGrantor.mockResolvedValue(
      successfulSummaryUpdateResponse,
    );
    mockUpdateOpportunitySummaryForGrantor.mockRejectedValue(
      new ApiRequestError("not found", "APIRequestError", 404),
    );

    const result = await opportunityEditFormAction(initialState, formData);

    expect(result).toEqual({ errorMessage: "notFound" });
  });

  it("maps 401 from publish to an unauthenticated error", async () => {
    const formData = buildValidFormData();
    formData.set("opportunity_id", "opp-123");
    formData.set("opportunity_summary_id", "sum-456");

    mockUpdateOpportunitySummaryForGrantor.mockResolvedValue(
      successfulSummaryUpdateResponse,
    );
    mockUpdateOpportunitySummaryForGrantor.mockRejectedValue(
      new ApiRequestError("unauthenticated", "APIRequestError", 401),
    );

    const result = await opportunityEditFormAction(initialState, formData);

    expect(result).toEqual({ errorMessage: "unauthenticated" });
  });
});

describe("opportunityEditFormAction", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("delegates to saveOpportunityEditAction and redirects to the overview page when submitType = saveAndExit", async () => {
    const formData = buildValidFormData();
    formData.set("opportunity_id", "opp-123");
    formData.set("opportunity_summary_id", "sum-456");
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
    formData.set("opportunity_id", "opp-123");
    formData.set("opportunity_summary_id", "sum-456");
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
    formData.set("opportunity_id", "opp-123");
    formData.set("opportunity_summary_id", "sum-456");
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
    formData.set("opportunity_id", "opp-123");
    formData.set("opportunity_summary_id", "sum-456");
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
    formData.set("opportunity_id", "opp-123");
    formData.set("opportunity_summary_id", "sum-456");
    formData.set("submitType", "saveAndContinue");
    formData.set("agency_email_address", "not-an-email");

    mockUpdateOpportunitySummaryForGrantor.mockResolvedValue(
      successfulSummaryUpdateResponse,
    );

    const result = await opportunityEditFormAction(initialState, formData);

    expect(mockUpdateOpportunitySummaryForGrantor).not.toHaveBeenCalledTimes(1);
    expect(mockRedirect).not.toHaveBeenCalledWith("../competition");
    expect(result.validationErrors).toEqual({
      agency_email_address: ["agency_email_address.invalid"],
    });
  });
});
