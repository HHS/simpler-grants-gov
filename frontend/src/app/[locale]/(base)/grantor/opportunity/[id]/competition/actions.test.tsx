import { identity } from "lodash";
import { ApiRequestError } from "src/errors";
import { updateCompetitionForms } from "src/services/fetch/fetchers/competitionFormsFetcher";
import {
  createCompetitionForGrantor,
  saveCompetitionInstructions,
  updateCompetitionForGrantor,
} from "src/services/fetch/fetchers/grantorOpportunitiesFetcher";
import { CompetitionFormsSubmitApi } from "src/types/competitionsResponseTypes";

import { competitionFormAction, updateCompetition } from "./actions";

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
}));

jest.mock("src/services/fetch/fetchers/grantorOpportunitiesFetcher", () => ({
  createCompetitionForGrantor: jest.fn(),
  saveCompetitionInstructions: jest.fn(),
  updateCompetitionForGrantor: jest.fn(),
}));

jest.mock("src/services/fetch/fetchers/competitionFormsFetcher", () => ({
  updateCompetitionForms: jest.fn,
}));

const mockRedirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (url: string): void => {
    mockRedirect(url);
  },
}));

const mockCreateCompetitionForGrantor = jest.mocked(
  createCompetitionForGrantor,
);
const mockUpdateCompetitionForGrantor = jest.mocked(
  updateCompetitionForGrantor,
);
const mockSaveCompetitionInstructions = jest.mocked(
  saveCompetitionInstructions,
);
const mockUpdateCompetitionForms = jest.mocked(updateCompetitionForms);

const mockRequiredForms: CompetitionFormsSubmitApi = [
  {
    form_id: "1623b310-85be-496a-b84b-34bdee22a68a",
    is_required: true,
  },
];

const successfulCreateResponse = {
  message: "success",
  status_code: 201,
  data: {
    competition_id: "new-competition-id",
  },
} as Awaited<ReturnType<typeof createCompetitionForGrantor>>;

const successfulUpdateResponse = {
  message: "success",
  status_code: 200,
  data: {
    competition_id: "existing-competition-id",
  },
} as Awaited<ReturnType<typeof updateCompetitionForGrantor>>;

function buildValidFormData(overrides?: Record<string, string>) {
  const formData = new FormData();
  formData.set("opportunityId", "opp-123");
  formData.set("competitionId", "compete-456");
  formData.set("competition_title", "Test Competition");
  formData.set("opening_date", "2026-06-01");
  formData.set("closing_date", "2026-07-01");
  formData.set("open_to_applicants", "both");
  formData.set("contact_name", "John Doe");
  formData.set("contact_title", "Manager");
  formData.set("contact_email", "john@example.com");
  formData.set("contact_phone", "555-0100");

  if (overrides) {
    Object.entries(overrides).forEach(([key, value]) => {
      formData.set(key, value);
    });
  }

  return formData;
}

describe("updateCompetition", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns an error when opportunityId is missing", async () => {
    const formData = new FormData();
    formData.set("competitionId", "compete-456");

    const result = await updateCompetition(formData, mockRequiredForms);

    expect(result).toEqual({
      errorMessage: "genericError",
    });
  });

  it("calls createCompetitionForGrantor when no competitionId", async () => {
    const formData = buildValidFormData();
    formData.delete("competitionId");

    mockCreateCompetitionForGrantor.mockResolvedValue(successfulCreateResponse);

    const result = await updateCompetition(formData, mockRequiredForms);

    expect(mockCreateCompetitionForGrantor).toHaveBeenCalledWith(
      "opp-123",
      expect.objectContaining({
        competition_title: "Test Competition",
        opening_date: "2026-06-01",
        closing_date: "2026-07-01",
      }),
    );
    expect(result).toEqual({
      successMessage: "success",
    });
  });

  it("updates competition forms with the new competition ID after creating", async () => {
    const formData = buildValidFormData();
    formData.delete("competitionId");

    mockCreateCompetitionForGrantor.mockResolvedValue(successfulCreateResponse);

    await updateCompetition(formData, mockRequiredForms);

    expect(mockUpdateCompetitionForms).toHaveBeenCalledWith({
      competitionId: "new-competition-id",
      body: { forms: mockRequiredForms },
    });
  });

  it("calls updateCompetitionForGrantor when competitionId exists", async () => {
    const formData = buildValidFormData();

    mockUpdateCompetitionForGrantor.mockResolvedValue(successfulUpdateResponse);

    const result = await updateCompetition(formData, mockRequiredForms);

    expect(mockUpdateCompetitionForGrantor).toHaveBeenCalledWith(
      "opp-123",
      "compete-456",
      expect.objectContaining({
        competition_title: "Test Competition",
        opening_date: "2026-06-01",
        closing_date: "2026-07-01",
      }),
    );
    expect(result).toEqual({
      successMessage: "success",
    });
  });

  it("updates competition forms with the existing competition ID", async () => {
    const formData = buildValidFormData();

    mockUpdateCompetitionForGrantor.mockResolvedValue(successfulUpdateResponse);

    await updateCompetition(formData, mockRequiredForms);

    expect(mockUpdateCompetitionForms).toHaveBeenCalledWith({
      competitionId: "compete-456",
      body: { forms: mockRequiredForms },
    });
  });

  it("saves application instructions when creating a competition with a pending file ID", async () => {
    const formData = buildValidFormData({
      "pending-file-id": "pending-file-789",
    });
    formData.delete("competitionId");

    mockCreateCompetitionForGrantor.mockResolvedValue(successfulCreateResponse);

    const result = await updateCompetition(formData, mockRequiredForms);

    expect(mockSaveCompetitionInstructions).toHaveBeenCalledWith(
      "opp-123",
      "new-competition-id",
      "pending-file-789",
    );
    expect(result).toEqual({
      successMessage: "success",
    });
  });

  it("saves application instructions when a pending file ID exists", async () => {
    const formData = buildValidFormData({
      "pending-file-id": "pending-file-789",
    });

    mockUpdateCompetitionForGrantor.mockResolvedValue(successfulUpdateResponse);

    const result = await updateCompetition(formData, mockRequiredForms);

    expect(mockSaveCompetitionInstructions).toHaveBeenCalledWith(
      "opp-123",
      "compete-456",
      "pending-file-789",
    );
    expect(result).toEqual({
      successMessage: "success",
    });
  });

  it("returns a generic error when saving application instructions fails", async () => {
    const formData = buildValidFormData({
      "pending-file-id": "pending-file-789",
    });

    mockUpdateCompetitionForGrantor.mockResolvedValue(successfulUpdateResponse);
    mockSaveCompetitionInstructions.mockRejectedValue(new Error("unexpected"));

    const result = await updateCompetition(formData, mockRequiredForms);

    expect(mockSaveCompetitionInstructions).toHaveBeenCalledWith(
      "opp-123",
      "compete-456",
      "pending-file-789",
    );
    expect(result).toEqual({
      errorMessage: "genericError",
    });
  });

  it("maps 401 to an unauthenticated error", async () => {
    const formData = buildValidFormData();

    mockUpdateCompetitionForGrantor.mockRejectedValue(
      new ApiRequestError("unauthenticated", "APIRequestError", 401),
    );

    const result = await updateCompetition(formData, mockRequiredForms);

    expect(result).toEqual({
      errorMessage: "unauthenticated",
    });
  });

  it("maps 403 to a forbidden error", async () => {
    const formData = buildValidFormData();

    mockUpdateCompetitionForGrantor.mockRejectedValue(
      new ApiRequestError("forbidden", "APIRequestError", 403),
    );

    const result = await updateCompetition(formData, mockRequiredForms);

    expect(result).toEqual({
      errorMessage: "forbidden",
    });
  });

  it("maps 404 to a not found error", async () => {
    const formData = buildValidFormData();

    mockUpdateCompetitionForGrantor.mockRejectedValue(
      new ApiRequestError("notFound", "APIRequestError", 404),
    );

    const result = await updateCompetition(formData, mockRequiredForms);

    expect(result).toEqual({
      errorMessage: "notFound",
    });
  });

  it("maps 422 to validationErrors with formatted error message", async () => {
    const formData = buildValidFormData();

    const apiError = new ApiRequestError(
      "Validation error",
      "ValidationError",
      422,
      {
        field: "open_to_applicants",
        message: "Shorter than minimum length 1.",
      },
    );

    mockUpdateCompetitionForGrantor.mockRejectedValue(apiError);

    const result = await updateCompetition(formData, mockRequiredForms);

    expect(result).toEqual({
      errorMessage: "validationErrors",
      validationErrors: ["open_to_applicants: Shorter than minimum length 1."],
    });
  });

  it("maps unknown errors to a generic error", async () => {
    const formData = buildValidFormData();

    mockUpdateCompetitionForGrantor.mockRejectedValue(new Error("unexpected"));

    const result = await updateCompetition(formData, mockRequiredForms);

    expect(result).toEqual({
      errorMessage: "genericError",
    });
  });
});

describe("competitionFormAction", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("delegates to updateCompetition and redirects to ../overview for saveAndExit", async () => {
    const formData = buildValidFormData();

    mockUpdateCompetitionForGrantor.mockResolvedValue(successfulUpdateResponse);

    await competitionFormAction("saveAndExit", mockRequiredForms, formData);

    expect(mockUpdateCompetitionForGrantor).toHaveBeenCalledTimes(1);
    expect(mockRedirect).toHaveBeenCalledWith("../overview");
  });

  it("delegates to updateCompetition and redirects to ../edit for saveAndGoBack", async () => {
    const formData = buildValidFormData();

    mockUpdateCompetitionForGrantor.mockResolvedValue(successfulUpdateResponse);

    await competitionFormAction("saveAndGoBack", mockRequiredForms, formData);

    expect(mockUpdateCompetitionForGrantor).toHaveBeenCalledTimes(1);
    expect(mockRedirect).toHaveBeenCalledWith("../edit");
  });

  it("delegates to updateCompetition and redirects to ../overview for saveAndContinue", async () => {
    const formData = buildValidFormData();

    mockUpdateCompetitionForGrantor.mockResolvedValue(successfulUpdateResponse);

    await competitionFormAction("saveAndContinue", mockRequiredForms, formData);

    expect(mockUpdateCompetitionForGrantor).toHaveBeenCalledTimes(1);
    expect(mockRedirect).toHaveBeenCalledWith("../overview");
  });

  it("returns errors without redirecting when updateCompetition returns errorMessage", async () => {
    const formData = buildValidFormData();

    mockUpdateCompetitionForGrantor.mockRejectedValue(
      new ApiRequestError("forbidden", "APIRequestError", 403),
    );

    const result = await competitionFormAction(
      "saveAndContinue",
      mockRequiredForms,
      formData,
    );

    expect(mockUpdateCompetitionForGrantor).toHaveBeenCalledTimes(1);
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(result).toEqual({
      errorMessage: "forbidden",
    });
  });

  it("returns saveResult for unknown submitType without redirecting", async () => {
    const formData = buildValidFormData();

    mockUpdateCompetitionForGrantor.mockResolvedValue(successfulUpdateResponse);

    const result = await competitionFormAction(
      "unknownType",
      mockRequiredForms,
      formData,
    );

    expect(mockUpdateCompetitionForGrantor).toHaveBeenCalledTimes(1);
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(result).toEqual({
      successMessage: "success",
    });
  });
});

describe("buildRequestBody (tested indirectly via updateCompetition)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("builds correct request body for 'both' applicant type", async () => {
    const formData = buildValidFormData();
    formData.delete("competitionId");

    mockCreateCompetitionForGrantor.mockResolvedValue(successfulCreateResponse);

    await updateCompetition(formData, mockRequiredForms);

    const requestBody = mockCreateCompetitionForGrantor.mock.calls[0][1];
    expect(requestBody.open_to_applicants).toEqual([
      "organization",
      "individual",
    ]);
  });

  it("builds correct request body for 'organizations_only' applicant type", async () => {
    const formData = buildValidFormData();
    formData.delete("competitionId");
    formData.set("open_to_applicants", "organizations_only");

    mockCreateCompetitionForGrantor.mockResolvedValue(successfulCreateResponse);

    await updateCompetition(formData, mockRequiredForms);

    const requestBody = mockCreateCompetitionForGrantor.mock.calls[0][1];
    expect(requestBody.open_to_applicants).toEqual(["organization"]);
  });

  it("builds correct request body for 'individuals_only' applicant type", async () => {
    const formData = buildValidFormData();
    formData.delete("competitionId");
    formData.set("open_to_applicants", "individuals_only");

    mockCreateCompetitionForGrantor.mockResolvedValue(successfulCreateResponse);

    await updateCompetition(formData, mockRequiredForms);

    const requestBody = mockCreateCompetitionForGrantor.mock.calls[0][1];
    expect(requestBody.open_to_applicants).toEqual(["individual"]);
  });

  it("concatenates contact info correctly", async () => {
    const formData = buildValidFormData();
    formData.delete("competitionId");

    mockCreateCompetitionForGrantor.mockResolvedValue(successfulCreateResponse);

    await updateCompetition(formData, mockRequiredForms);

    const requestBody = mockCreateCompetitionForGrantor.mock.calls[0][1];
    expect(requestBody.contact_info).toBe(
      "John Doe, Manager, john@example.com, 555-0100",
    );
  });

  it("handles empty field values by returning null", async () => {
    const formData = buildValidFormData();
    formData.delete("competitionId");
    formData.set("competition_title", "");
    formData.set("opening_date", "");
    formData.set("closing_date", "");

    mockCreateCompetitionForGrantor.mockResolvedValue(successfulCreateResponse);

    await updateCompetition(formData, mockRequiredForms);

    const requestBody = mockCreateCompetitionForGrantor.mock.calls[0][1];
    expect(requestBody.competition_title).toBeNull();
    expect(requestBody.opening_date).toBeNull();
    expect(requestBody.closing_date).toBeNull();
  });
});
