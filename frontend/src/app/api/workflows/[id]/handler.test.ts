import * as sessionModule from "src/services/auth/session";
import * as workflowFetcherModule from "src/services/fetch/fetchers/workflowFetcher";
import { NotFoundError } from "src/errors";
import { NextResponse } from "next/server";

import { GET } from "./handler";

jest.mock("src/services/auth/session");
jest.mock("src/services/fetch/fetchers/workflowFetcher");

jest.mock("next/server", () => ({
  NextRequest: class NextRequest {},
  NextResponse: {
    json: jest.fn(),
  },
}));

jest.mock("src/services/auth/sessionUtils", () => ({
  decrypt: jest.fn(),
  encrypt: jest.fn(),
  CLIENT_JWT_ENCRYPTION_ALGORITHM: "HS256",
  API_JWT_ENCRYPTION_ALGORITHM: "RS256",
  newExpirationDate: () => new Date(0),
}));

describe("GET /api/workflows/[id]", () => {
  const mockSession = {
    user_id: "test-user-id",
    email: "test@example.com",
    token: "test-token",
  };

  const mockWorkflowDetails = {
    workflow_id: "workflow-123",
    current_workflow_state: "pending_review",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock NextResponse.json to return proper response objects
    (NextResponse.json as jest.Mock).mockImplementation((data: unknown, init?: ResponseInit) => {
      const status = init?.status || 200;
      return {
        json: jest.fn().mockResolvedValue(data),
        status,
        ok: status >= 200 && status < 300,
      };
    });
  });

  it("returns workflow details when request is valid", async () => {
    (sessionModule.getSession as jest.Mock).mockResolvedValue(mockSession);
    (
      workflowFetcherModule.getWorkflowDetails as jest.Mock
    ).mockResolvedValue(mockWorkflowDetails);

    const req = {} as any;
    const params = Promise.resolve({ id: "workflow-123" });
    const res = await GET(req, { params });
    const json = (await res.json()) as { data: typeof mockWorkflowDetails };

    expect(sessionModule.getSession).toHaveBeenCalled();
    expect(workflowFetcherModule.getWorkflowDetails).toHaveBeenCalledWith(
      "workflow-123",
    );
    expect(json.data).toEqual(mockWorkflowDetails);
    expect(res.status).toBe(200);
  });

  it("returns 400 when workflow ID is missing", async () => {
    (sessionModule.getSession as jest.Mock).mockResolvedValue(mockSession);

    const req = {} as any;
    const params = Promise.resolve({ id: "" });
    const res = await GET(req, { params });
    const json = (await res.json()) as { error: string };

    expect(json.error).toBe("Workflow ID is required");
    expect(res.status).toBe(400);
    expect(workflowFetcherModule.getWorkflowDetails).not.toHaveBeenCalled();
  });

  it("returns 401 when user is not authenticated", async () => {
    (sessionModule.getSession as jest.Mock).mockResolvedValue(null);

    const req = {} as any;
    const params = Promise.resolve({ id: "workflow-123" });
    const res = await GET(req, { params });
    const json = (await res.json()) as { error: string };

    expect(json.error).toBe("Not logged in, cannot retrieve workflow details");
    expect(res.status).toBe(401);
    expect(workflowFetcherModule.getWorkflowDetails).not.toHaveBeenCalled();
  });

  it("returns 404 when workflow is not found", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    
    (sessionModule.getSession as jest.Mock).mockResolvedValue(mockSession);
    (workflowFetcherModule.getWorkflowDetails as jest.Mock).mockRejectedValue(
      new NotFoundError("Workflow not found"),
    );

    const req = {} as any;
    const params = Promise.resolve({ id: "nonexistent-workflow" });
    const res = await GET(req, { params });
    const json = (await res.json()) as { error: string };

    expect(sessionModule.getSession).toHaveBeenCalled();
    expect(workflowFetcherModule.getWorkflowDetails).toHaveBeenCalledWith(
      "nonexistent-workflow",
    );
    expect(json.error).toBeDefined();
    expect(res.status).toBe(404);
    
    consoleErrorSpy.mockRestore();
  });

  it("returns 500 when an unexpected error occurs", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    
    (sessionModule.getSession as jest.Mock).mockResolvedValue(mockSession);
    (workflowFetcherModule.getWorkflowDetails as jest.Mock).mockRejectedValue(
      new Error("Database error"),
    );

    const req = {} as any;
    const params = Promise.resolve({ id: "workflow-123" });
    const res = await GET(req, { params });
    const json = (await res.json()) as { error: string };

    expect(sessionModule.getSession).toHaveBeenCalled();
    expect(workflowFetcherModule.getWorkflowDetails).toHaveBeenCalledWith(
      "workflow-123",
    );
    expect(json.error).toBeDefined();
    expect(res.status).toBe(500);
    
    consoleErrorSpy.mockRestore();
  });
});
