import {
  deleteAwardRecommendationRisk,
  getAwardRecommendationDetails,
  getAwardRecommendationRisk,
  getAwardRecommendationRisks,
  getAwardRecommendationSubmission,
  getAwardRecommendationSubmissionsForRisk,
  listAwardRecommendationsPaginated,
  listAwardRecommendationSubmissions,
  listAwardRecommendationSubmissionsPaginated,
  updateAwardRecommendationRisk,
  updateAwardRecommendationSubmissionDetails,
} from "src/services/fetch/fetchers/awardRecommendationFetcher";
import { APIResponse } from "src/types/apiResponseTypes";
import {
  mockAwardRecommendationDetails,
  mockAwardRecommendationListItem,
  mockAwardRecommendationSubmissions,
} from "src/utils/testing/fixtures";

const mockJson = jest.fn().mockResolvedValue({
  data: mockAwardRecommendationDetails,
} as APIResponse);

const mockFetchAwardRecommendation = jest.fn().mockResolvedValue({
  json: mockJson,
});
const mockInnerFetch = jest.fn();

const setupDefaultInnerFetchMock = () => {
  mockInnerFetch.mockImplementation(
    ({ subPath }: { subPath: string }) =>
      Promise.resolve({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: subPath.endsWith("/submissions/list")
            ? mockAwardRecommendationSubmissions
            : subPath.endsWith("/risks/list")
              ? []
              : null,
          pagination_info: subPath.endsWith("/list")
            ? { total_pages: 1 }
            : undefined,
          message: subPath.includes("/risks/") ? "Success" : undefined,
        } as APIResponse),
      }) as unknown as Promise<Response>,
  );
};

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchAwardRecommendation: (params: unknown): Promise<Response> =>
    mockFetchAwardRecommendation(params) as unknown as Promise<Response>,
  fetchAwardRecommendationWithMethod: (): jest.Mock => mockInnerFetch,
}));

beforeEach(() => {
  setupDefaultInnerFetchMock();
});

describe("getAwardRecommendationDetails", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("calls fetchAwardRecommendation with the correct arguments", async () => {
    await getAwardRecommendationDetails("an id");
    expect(mockFetchAwardRecommendation).toHaveBeenCalledWith({
      subPath: "an id",
    });
  });

  it("returns the expected award recommendation details", async () => {
    const result = await getAwardRecommendationDetails("an id");
    expect(mockJson).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockAwardRecommendationDetails);
  });
});

describe("listAwardRecommendationSubmissions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("calls fetchAwardRecommendationWithMethod with the correct arguments", async () => {
    await listAwardRecommendationSubmissions("an id");

    expect(mockInnerFetch).toHaveBeenCalledWith({
      subPath: "an id/submissions/list",
      body: {
        pagination: {
          page_offset: 1,
          page_size: 100,
          sort_order: [
            {
              order_by: "application_submission_number",
              sort_direction: "ascending",
            },
          ],
        },
      },
    });
  });

  it("returns award recommendation submissions", async () => {
    const result = await listAwardRecommendationSubmissions("an id");

    expect(result).toEqual(mockAwardRecommendationSubmissions);
  });
});

describe("listAwardRecommendationsPaginated", () => {
  beforeEach(() => {
    mockInnerFetch.mockImplementation(
      ({ subPath }: { subPath: string }) =>
        Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            data: subPath === "list" ? [mockAwardRecommendationListItem] : null,
            pagination_info: { total_pages: 1, total_records: 1 },
          } as APIResponse),
        }) as unknown as Promise<Response>,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("calls fetchAwardRecommendationWithMethod with agency filter and pagination", async () => {
    await listAwardRecommendationsPaginated("agency-id", {
      page_offset: 1,
      page_size: 10,
      sort_order: [
        {
          order_by: "created_at",
          sort_direction: "descending",
        },
      ],
    });

    expect(mockInnerFetch).toHaveBeenCalledWith({
      subPath: "list",
      body: {
        filters: { agency_id: { one_of: ["agency-id"] } },
        pagination: {
          page_offset: 1,
          page_size: 10,
          sort_order: [
            {
              order_by: "created_at",
              sort_direction: "descending",
            },
          ],
        },
      },
    });
  });

  it("returns award recommendations and pagination info", async () => {
    const result = await listAwardRecommendationsPaginated("agency-id", {
      page_offset: 1,
      page_size: 10,
      sort_order: [],
    });

    expect(result.awardRecommendations).toEqual([
      mockAwardRecommendationListItem,
    ]);
    expect(result.paginationInfo).toEqual({ total_pages: 1, total_records: 1 });
  });
});

describe("listAwardRecommendationSubmissionsPaginated", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("calls fetchAwardRecommendationWithMethod with pagination and filters", async () => {
    await listAwardRecommendationSubmissionsPaginated(
      "an id",
      {
        page_offset: 2,
        page_size: 10,
        sort_order: [],
      },
      {
        award_recommendation_type: { one_of: ["recommended_for_funding"] },
      },
    );

    expect(mockInnerFetch).toHaveBeenCalledWith({
      subPath: "an id/submissions/list",
      body: {
        filters: {
          award_recommendation_type: { one_of: ["recommended_for_funding"] },
        },
        pagination: {
          page_offset: 2,
          page_size: 10,
          sort_order: [],
        },
      },
    });
  });
});

describe("getAwardRecommendationSubmission", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the matching award recommendation submission", async () => {
    const result = await getAwardRecommendationSubmission(
      "an id",
      mockAwardRecommendationSubmissions[0]
        .award_recommendation_application_submission_id,
    );

    expect(result).toEqual(mockAwardRecommendationSubmissions[0]);
  });

  it("returns null when no award recommendation submission matches", async () => {
    const result = await getAwardRecommendationSubmission(
      "an id",
      "not-a-real-id",
    );

    expect(result).toBeNull();
  });
});

describe("updateAwardRecommendationSubmissionDetails", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("calls fetchAwardRecommendationWithMethod with the correct arguments", async () => {
    const submissionId =
      mockAwardRecommendationSubmissions[0]
        .award_recommendation_application_submission_id;

    await updateAwardRecommendationSubmissionDetails("an id", {
      [submissionId]: {
        award_recommendation_type: "recommended_for_funding",
        recommended_amount: "50000.00",
        has_exception: false,
      },
    });

    expect(mockInnerFetch).toHaveBeenCalledWith({
      subPath: "an id/submission-details",
      body: {
        award_recommendation_submissions: {
          [submissionId]: {
            award_recommendation_type: "recommended_for_funding",
            recommended_amount: "50000.00",
            has_exception: false,
          },
        },
      },
    });
  });
});

describe("getAwardRecommendationRisks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches and returns risks and pagination info", async () => {
    const result = await getAwardRecommendationRisks("award-id", {
      page_offset: 1,
      page_size: 10,
      sort_order: [
        {
          order_by: "created_at",
          sort_direction: "ascending",
        },
      ],
    });
    expect(result.risks).toBeDefined();
    expect(result.paginationInfo).toBeDefined();
    expect(mockInnerFetch).toHaveBeenCalled();
  });
});

describe("deleteAwardRecommendationRisk", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes risk successfully", async () => {
    const result = await deleteAwardRecommendationRisk("award-id", "risk-id");
    expect(result.success).toBe(true);
    expect(result.message).toBeDefined();
    expect(mockInnerFetch).toHaveBeenCalled();
  });
});

describe("getAwardRecommendationRisk", () => {
  const mockRisk = {
    award_recommendation_risk_id: "risk-id-123",
    award_recommendation_risk_number: "RSK-26-00001",
    risk_number: 1,
    comment: "Test risk",
    condition: "Condition 1",
    award_recommendation_application_submission_ids: [],
    applications: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockInnerFetch.mockImplementation(
      ({ subPath }: { subPath: string }) =>
        Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            data: subPath.endsWith("/risks/list")
              ? [mockRisk]
              : mockAwardRecommendationSubmissions,
            pagination_info: { total_pages: 1 },
          } as APIResponse),
        }) as unknown as Promise<Response>,
    );
  });

  it("returns the matching risk", async () => {
    const result = await getAwardRecommendationRisk("award-id", "risk-id-123");

    expect(mockInnerFetch).toHaveBeenCalledWith({
      subPath: "award-id/risks/list",
      body: {
        pagination: {
          page_offset: 1,
          page_size: 100,
          sort_order: [
            {
              order_by: "created_at",
              sort_direction: "ascending",
            },
          ],
        },
      },
    });
    expect(result).toEqual(mockRisk);
  });

  it("returns null when no risk matches", async () => {
    const result = await getAwardRecommendationRisk("award-id", "missing-id");

    expect(result).toBeNull();
  });
});

describe("getAwardRecommendationSubmissionsForRisk", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInnerFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: mockAwardRecommendationSubmissions,
      } as APIResponse),
    });
  });

  it("returns submissions linked to the risk", async () => {
    const submissionId =
      mockAwardRecommendationSubmissions[0]
        .award_recommendation_application_submission_id;

    const result = await getAwardRecommendationSubmissionsForRisk("award-id", [
      submissionId,
    ]);

    expect(result).toEqual(mockAwardRecommendationSubmissions);
  });
});

describe("updateAwardRecommendationRisk", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls fetchAwardRecommendationWithMethod with the correct arguments", async () => {
    await updateAwardRecommendationRisk("award-id", "risk-id", {
      comment: "Updated risk",
      award_recommendation_risk_type: "additional_monitoring",
      award_recommendation_application_submission_ids: ["submission-id"],
    });

    expect(mockInnerFetch).toHaveBeenCalledWith({
      subPath: "award-id/risks/risk-id",
      body: {
        comment: "Updated risk",
        award_recommendation_risk_type: "additional_monitoring",
        award_recommendation_application_submission_ids: ["submission-id"],
      },
    });
  });
});
