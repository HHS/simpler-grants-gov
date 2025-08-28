/**
 * @jest-environment node
 */

import { createApiKeyHandler } from "src/app/api/user/api-keys/handler";
import { ApiKey } from "src/types/apiKeyTypes";
import { UserSession } from "src/types/authTypes";
import { baseApiKey } from "src/utils/testing/fixtures";

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
const mockHandleCreateApiKey = jest.fn();

jest.mock("src/services/fetch/fetchers/apiKeyFetcher", () => ({
  handleCreateApiKey: (...args: unknown[]) =>
    mockHandleCreateApiKey(...args) as Promise<{
      status_code: number;
      data?: ApiKey;
      message: string;
    }>,
}));

interface JsonData {
  message: string;
  data?: ApiKey;
}

const mockApiKeyResponse: ApiKey = baseApiKey;

describe("POST /api/user/api-keys", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHandleCreateApiKey.mockResolvedValue({
      status_code: 200,
      data: mockApiKeyResponse,
      message: "Success",
    });
  });

  it("creates an API key successfully", async () => {
    const request = new NextRequest("http://localhost:3000/api/user/api-keys", {
      method: "POST",
      body: JSON.stringify({ key_name: "Test API Key" }),
    });

    const response = await createApiKeyHandler(request);
    const data = (await response.json()) as JsonData;

    expect(response.status).toBe(200);
    expect(data.message).toBe("API key created successfully");
    expect(data.data).toEqual(mockApiKeyResponse);
    expect(mockHandleCreateApiKey).toHaveBeenCalledWith(
      "test-token",
      "test-user-id",
      "Test API Key",
    );
  });

  it("returns 401 when no session exists", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost:3000/api/user/api-keys", {
      method: "POST",
      body: JSON.stringify({ key_name: "Test API Key" }),
    });

    const response = await createApiKeyHandler(request);
    const data = (await response.json()) as JsonData;

    expect(response.status).toBe(401);
    expect(data.message).toContain("No active session to create API key");
    expect(mockHandleCreateApiKey).not.toHaveBeenCalled();
  });

  it("returns 401 when session has no token", async () => {
    mockGetSession.mockResolvedValueOnce({
      user_id: "test-user-id",
    } as Partial<UserSession> as UserSession);

    const request = new NextRequest("http://localhost:3000/api/user/api-keys", {
      method: "POST",
      body: JSON.stringify({ key_name: "Test API Key" }),
    });

    const response = await createApiKeyHandler(request);
    const data = (await response.json()) as JsonData;

    expect(response.status).toBe(401);
    expect(data.message).toContain("No active session to create API key");
    expect(mockHandleCreateApiKey).not.toHaveBeenCalled();
  });

  it("returns 400 when no key name is provided", async () => {
    const request = new NextRequest("http://localhost:3000/api/user/api-keys", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await createApiKeyHandler(request);
    const data = (await response.json()) as JsonData;

    expect(response.status).toBe(400);
    expect(data.message).toContain("No key name supplied for API key");
    expect(mockHandleCreateApiKey).not.toHaveBeenCalled();
  });

  it("returns 400 when key name is empty", async () => {
    const request = new NextRequest("http://localhost:3000/api/user/api-keys", {
      method: "POST",
      body: JSON.stringify({ key_name: "" }),
    });

    const response = await createApiKeyHandler(request);
    const data = (await response.json()) as JsonData;

    expect(response.status).toBe(400);
    expect(data.message).toContain("No key name supplied for API key");
    expect(mockHandleCreateApiKey).not.toHaveBeenCalled();
  });

  it("handles API key creation failure", async () => {
    mockHandleCreateApiKey.mockResolvedValueOnce({
      status_code: 500,
      message: "Internal server error",
    });

    const request = new NextRequest("http://localhost:3000/api/user/api-keys", {
      method: "POST",
      body: JSON.stringify({ key_name: "Test API Key" }),
    });

    const response = await createApiKeyHandler(request);
    const data = (await response.json()) as JsonData;

    expect(response.status).toBe(500);
    expect(data.message).toContain("Error creating API key");
  });

  it("handles unexpected errors", async () => {
    mockHandleCreateApiKey.mockRejectedValueOnce(new Error("Network error"));

    const request = new NextRequest("http://localhost:3000/api/user/api-keys", {
      method: "POST",
      body: JSON.stringify({ key_name: "Test API Key" }),
    });

    const response = await createApiKeyHandler(request);
    const data = (await response.json()) as JsonData;

    expect(response.status).toBe(500);
    expect(data.message).toContain("Error attempting to create API key");
  });

  it("handles invalid JSON in request body", async () => {
    const request = new NextRequest("http://localhost:3000/api/user/api-keys", {
      method: "POST",
      body: "invalid json",
    });

    const response = await createApiKeyHandler(request);
    const data = (await response.json()) as JsonData;

    expect(response.status).toBe(500);
    expect(data.message).toContain("Error attempting to create API key");
    expect(mockHandleCreateApiKey).not.toHaveBeenCalled();
  });
});
