/**
 * @jest-environment node
 */

import { renameApiKeyHandler } from "src/app/api/user/api-keys/[apiKeyId]/handler";
import { ApiKey } from "src/types/apiKeyTypes";
import { NextRequest } from "next/server";

// Mock the session
const mockSession = {
  token: "test-token",
  user_id: "test-user-id",
};

const mockGetSession = jest.fn(() => Promise.resolve(mockSession));

jest.mock("src/services/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

// Mock the API key fetcher
const mockHandleRenameApiKey = jest.fn();

jest.mock("src/services/fetch/fetchers/apiKeyFetcher", () => ({
  handleRenameApiKey: (...args: unknown[]) => mockHandleRenameApiKey(...args),
}));

const mockApiKeyResponse: ApiKey = {
  api_key_id: "test-key-id",
  key_name: "Renamed API Key",
  key_id: "abc123",
  created_at: "2023-01-01T00:00:00Z",
  last_used: null,
  is_active: true,
};

describe("PUT /api/user/api-keys/[apiKeyId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHandleRenameApiKey.mockResolvedValue({
      status_code: 200,
      data: mockApiKeyResponse,
      message: "Success",
    });
  });

  it("renames an API key successfully", async () => {
    const request = new NextRequest("http://localhost:3000/api/user/api-keys/test-key-id", {
      method: "PUT",
      body: JSON.stringify({ key_name: "Renamed API Key" }),
    });

    const params = Promise.resolve({ apiKeyId: "test-key-id" });
    const response = await renameApiKeyHandler(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("API key renamed successfully");
    expect(data.data).toEqual(mockApiKeyResponse);
    expect(mockHandleRenameApiKey).toHaveBeenCalledWith(
      "test-token",
      "test-user-id",
      "test-key-id",
      "Renamed API Key"
    );
  });

  it("returns 401 when no session exists", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost:3000/api/user/api-keys/test-key-id", {
      method: "PUT",
      body: JSON.stringify({ key_name: "Renamed API Key" }),
    });

    const params = Promise.resolve({ apiKeyId: "test-key-id" });
    const response = await renameApiKeyHandler(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toContain("No active session to rename API key");
    expect(mockHandleRenameApiKey).not.toHaveBeenCalled();
  });

  it("returns 401 when session has no token", async () => {
    mockGetSession.mockResolvedValueOnce({ user_id: "test-user-id" });

    const request = new NextRequest("http://localhost:3000/api/user/api-keys/test-key-id", {
      method: "PUT",
      body: JSON.stringify({ key_name: "Renamed API Key" }),
    });

    const params = Promise.resolve({ apiKeyId: "test-key-id" });
    const response = await renameApiKeyHandler(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toContain("No active session to rename API key");
    expect(mockHandleRenameApiKey).not.toHaveBeenCalled();
  });

  it("returns 400 when no API key ID is provided", async () => {
    const request = new NextRequest("http://localhost:3000/api/user/api-keys/", {
      method: "PUT",
      body: JSON.stringify({ key_name: "Renamed API Key" }),
    });

    const params = Promise.resolve({ apiKeyId: "" });
    const response = await renameApiKeyHandler(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain("No API key ID provided");
    expect(mockHandleRenameApiKey).not.toHaveBeenCalled();
  });

  it("returns 400 when no key name is provided", async () => {
    const request = new NextRequest("http://localhost:3000/api/user/api-keys/test-key-id", {
      method: "PUT",
      body: JSON.stringify({}),
    });

    const params = Promise.resolve({ apiKeyId: "test-key-id" });
    const response = await renameApiKeyHandler(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain("No key name supplied for API key");
    expect(mockHandleRenameApiKey).not.toHaveBeenCalled();
  });

  it("returns 400 when key name is empty", async () => {
    const request = new NextRequest("http://localhost:3000/api/user/api-keys/test-key-id", {
      method: "PUT",
      body: JSON.stringify({ key_name: "" }),
    });

    const params = Promise.resolve({ apiKeyId: "test-key-id" });
    const response = await renameApiKeyHandler(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain("No key name supplied for API key");
    expect(mockHandleRenameApiKey).not.toHaveBeenCalled();
  });

  it("handles API key rename failure", async () => {
    mockHandleRenameApiKey.mockResolvedValueOnce({
      status_code: 404,
      message: "API key not found",
    });

    const request = new NextRequest("http://localhost:3000/api/user/api-keys/test-key-id", {
      method: "PUT",
      body: JSON.stringify({ key_name: "Renamed API Key" }),
    });

    const params = Promise.resolve({ apiKeyId: "test-key-id" });
    const response = await renameApiKeyHandler(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toContain("Error renaming API key");
  });

  it("handles unexpected errors", async () => {
    mockHandleRenameApiKey.mockRejectedValueOnce(new Error("Network error"));

    const request = new NextRequest("http://localhost:3000/api/user/api-keys/test-key-id", {
      method: "PUT",
      body: JSON.stringify({ key_name: "Renamed API Key" }),
    });

    const params = Promise.resolve({ apiKeyId: "test-key-id" });
    const response = await renameApiKeyHandler(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toContain("Error attempting to rename API key");
  });

  it("handles invalid JSON in request body", async () => {
    const request = new NextRequest("http://localhost:3000/api/user/api-keys/test-key-id", {
      method: "PUT",
      body: "invalid json",
    });

    const params = Promise.resolve({ apiKeyId: "test-key-id" });
    const response = await renameApiKeyHandler(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toContain("Error attempting to rename API key");
    expect(mockHandleRenameApiKey).not.toHaveBeenCalled();
  });
});
