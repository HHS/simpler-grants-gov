/**
 * @jest-environment node
 */

import { listApiKeysHandler } from "src/app/api/user/api-keys/list/handler";
import { ApiKey } from "src/types/apiKeyTypes";
import { UserSession } from "src/types/authTypes";

import { NextRequest } from "next/server";

// Mock the session
const mockSession: UserSession = {
  token: "test-token",
  user_id: "test-user-id",
  email: "test@example.com",
  session_duration_minutes: 60,
};

const mockGetSession = jest.fn<Promise<UserSession | null>, []>(() =>
  Promise.resolve(mockSession),
);

jest.mock("src/services/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

// Mock the API key fetcher
const mockHandleListApiKeys = jest.fn();

jest.mock("src/services/fetch/fetchers/apiKeyFetcher", () => ({
  handleListApiKeys: (...args: unknown[]) =>
    mockHandleListApiKeys(...args) as Promise<{
      status_code: number;
      data?: ApiKey[];
      message: string;
    }>,
}));

interface JsonData {
  message: string;
  data?: ApiKey[];
}

const mockApiKeys: ApiKey[] = [
  {
    api_key_id: "key-1",
    key_name: "Test Key 1",
    key_id: "abc123",
    created_at: "2023-01-01T00:00:00Z",
    last_used: "2023-01-02T00:00:00Z",
    is_active: true,
  },
  {
    api_key_id: "key-2",
    key_name: "Test Key 2",
    key_id: "def456",
    created_at: "2023-01-03T00:00:00Z",
    last_used: null,
    is_active: true,
  },
];

describe("POST /api/user/api-keys/list", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHandleListApiKeys.mockResolvedValue({
      status_code: 200,
      data: mockApiKeys,
      message: "Success",
    });
  });

  it("lists API keys successfully", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/user/api-keys/list",
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );

    const response = await listApiKeysHandler(request);
    const data = (await response.json()) as JsonData;

    expect(response.status).toBe(200);
    expect(data.message).toBe("API keys retrieved successfully");
    expect(data.data).toEqual(mockApiKeys);
    expect(mockHandleListApiKeys).toHaveBeenCalledWith(
      "test-token",
      "test-user-id",
    );
  });

  it("returns 401 when no session exists", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const request = new NextRequest(
      "http://localhost:3000/api/user/api-keys/list",
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );

    const response = await listApiKeysHandler(request);
    const data = (await response.json()) as JsonData;

    expect(response.status).toBe(401);
    expect(data.message).toContain("No active session to list API keys");
    expect(mockHandleListApiKeys).not.toHaveBeenCalled();
  });

  it("returns 401 when session has no token", async () => {
    mockGetSession.mockResolvedValueOnce({
      user_id: "test-user-id",
    } as Partial<UserSession> as UserSession);

    const request = new NextRequest(
      "http://localhost:3000/api/user/api-keys/list",
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );

    const response = await listApiKeysHandler(request);
    const data = (await response.json()) as JsonData;

    expect(response.status).toBe(401);
    expect(data.message).toContain("No active session to list API keys");
    expect(mockHandleListApiKeys).not.toHaveBeenCalled();
  });

  it("handles API key listing failure", async () => {
    mockHandleListApiKeys.mockResolvedValueOnce({
      status_code: 500,
      message: "Internal server error",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/user/api-keys/list",
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );

    const response = await listApiKeysHandler(request);
    const data = (await response.json()) as JsonData;

    expect(response.status).toBe(500);
    expect(data.message).toContain("Error listing API keys");
  });

  it("handles unexpected errors", async () => {
    mockHandleListApiKeys.mockRejectedValueOnce(new Error("Network error"));

    const request = new NextRequest(
      "http://localhost:3000/api/user/api-keys/list",
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );

    const response = await listApiKeysHandler(request);
    const data = (await response.json()) as JsonData;

    expect(response.status).toBe(500);
    expect(data.message).toContain("Error attempting to list API keys");
  });

  it("returns empty list when no API keys exist", async () => {
    mockHandleListApiKeys.mockResolvedValueOnce({
      status_code: 200,
      data: [],
      message: "Success",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/user/api-keys/list",
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );

    const response = await listApiKeysHandler(request);
    const data = (await response.json()) as JsonData;

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
  });
});
