import { NotFoundError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { deleteCompetitionInstructions } from "src/services/fetch/fetchers/grantorOpportunitiesFetcher";

import { NextRequest, NextResponse } from "next/server";

import { DELETE } from "./handler";

jest.mock("src/services/auth/session", () => ({
  getSession: jest.fn(),
}));

jest.mock("src/services/fetch/fetchers/grantorOpportunitiesFetcher", () => ({
  deleteCompetitionInstructions: jest.fn(),
}));

const mockGetSession = jest.mocked(getSession);
const mockDeleteCompetitionInstructions = jest.mocked(
  deleteCompetitionInstructions,
);

const mockSession = {
  user_id: "test-user-id",
  email: "test@example.com",
  token: "test-token",
  session_duration_minutes: 60,
};

jest.mock("next/server", () => ({
  NextRequest: class NextRequest {},
  NextResponse: {
    json: jest.fn(),
  },
}));

const buildContext = (
  opportunityId = "opportunity-123",
  competitionId = "competition-123",
  fileId = "instruction-123",
) => ({
  params: Promise.resolve({ opportunityId, competitionId, fileId }),
});

describe("DELETE competition instruction handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (NextResponse.json as jest.Mock).mockImplementation(
      (data: unknown, init?: ResponseInit) => {
        const status = init?.status || 200;
        return {
          json: jest.fn().mockResolvedValue(data),
          status,
          ok: status >= 200 && status < 300,
        };
      },
    );

    mockGetSession.mockResolvedValue(mockSession);
    mockDeleteCompetitionInstructions.mockResolvedValue({
      data: {},
      status_code: 200,
      message: "Instruction deleted",
    });
  });

  it("deletes a competition instruction successfully", async () => {
    const response = await DELETE({} as NextRequest, buildContext());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: {
        data: {},
        status_code: 200,
        message: "Instruction deleted",
      },
    });
    expect(mockGetSession).toHaveBeenCalledTimes(1);
    expect(mockDeleteCompetitionInstructions).toHaveBeenCalledWith(
      "opportunity-123",
      "competition-123",
      "instruction-123",
    );
  });

  it.each([
    [
      "opportunityId",
      "",
      "competition-123",
      "instruction-123",
      "Opportunity ID is required",
    ],
    [
      "competitionId",
      "opportunity-123",
      "",
      "instruction-123",
      "Competition ID is required",
    ],
    [
      "fileId",
      "opportunity-123",
      "competition-123",
      "",
      "Competition Instruction ID is required",
    ],
  ])(
    "returns 400 when %s is missing",
    async (_name, opportunityId, competitionId, fileId, error) => {
      const response = await DELETE(
        {} as NextRequest,
        buildContext(opportunityId, competitionId, fileId),
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error });
      expect(mockGetSession).not.toHaveBeenCalled();
      expect(mockDeleteCompetitionInstructions).not.toHaveBeenCalled();
    },
  );

  it("returns 401 when the user is not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const response = await DELETE({} as NextRequest, buildContext());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Not logged in, cannot delete competition instructions file",
    });
    expect(mockDeleteCompetitionInstructions).not.toHaveBeenCalled();
  });

  it("returns the backend error status when deletion fails", async () => {
    mockDeleteCompetitionInstructions.mockRejectedValueOnce(
      new NotFoundError("Instruction file not found"),
    );

    const response = await DELETE({} as NextRequest, buildContext());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual(
      expect.objectContaining({ error: "Instruction file not found" }),
    );
  });

  it("returns 500 for unexpected errors", async () => {
    mockDeleteCompetitionInstructions.mockRejectedValueOnce(
      new Error("Network error"),
    );

    const response = await DELETE({} as NextRequest, buildContext());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual(
      expect.objectContaining({ error: "Network error" }),
    );
  });
});
