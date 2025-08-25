import {
  handleCreateApiKey,
  handleListApiKeys,
  handleRenameApiKey,
} from "src/services/fetch/fetchers/apiKeyFetcher";
import { ApiKey } from "src/types/apiKeyTypes";

const mockFetchUserWithMethod = jest.fn();

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchUserWithMethod: (method: string) => mockFetchUserWithMethod,
}));

const mockApiKey: ApiKey = {
  api_key_id: "test-key-id",
  key_name: "Test API Key",
  key_id: "abc123",
  created_at: "2023-01-01T00:00:00Z",
  last_used: null,
  is_active: true,
};

const mockApiKeys: ApiKey[] = [
  mockApiKey,
  {
    api_key_id: "test-key-id-2",
    key_name: "Test API Key 2",
    key_id: "def456",
    created_at: "2023-01-02T00:00:00Z",
    last_used: "2023-01-03T00:00:00Z",
    is_active: true,
  },
];

describe("apiKeyFetcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("handleCreateApiKey", () => {
    it("creates an API key successfully", async () => {
      const mockResponse = {
        json: () => Promise.resolve({
          status_code: 200,
          data: mockApiKey,
          message: "Success",
        }),
      };

      mockFetchUserWithMethod.mockResolvedValue(mockResponse);

      const result = await handleCreateApiKey("test-token", "test-user-id", "Test API Key");

      expect(mockFetchUserWithMethod).toHaveBeenCalledWith({
        subPath: "test-user-id/api-keys",
        additionalHeaders: {
          "X-SGG-Token": "test-token",
        },
        body: { key_name: "Test API Key" },
      });

      expect(result.status_code).toBe(200);
      expect(result.data).toEqual(mockApiKey);
    });

    it("handles API key creation failure", async () => {
      const mockResponse = {
        json: () => Promise.resolve({
          status_code: 400,
          message: "Invalid key name",
        }),
      };

      mockFetchUserWithMethod.mockResolvedValue(mockResponse);

      const result = await handleCreateApiKey("test-token", "test-user-id", "");

      expect(result.status_code).toBe(400);
      expect(result.message).toBe("Invalid key name");
    });

    it("handles network errors", async () => {
      mockFetchUserWithMethod.mockRejectedValue(new Error("Network error"));

      await expect(
        handleCreateApiKey("test-token", "test-user-id", "Test API Key")
      ).rejects.toThrow("Network error");
    });
  });

  describe("handleListApiKeys", () => {
    it("lists API keys successfully", async () => {
      const mockResponse = {
        json: () => Promise.resolve({
          status_code: 200,
          data: mockApiKeys,
          message: "Success",
        }),
      };

      mockFetchUserWithMethod.mockResolvedValue(mockResponse);

      const result = await handleListApiKeys("test-token", "test-user-id");

      expect(mockFetchUserWithMethod).toHaveBeenCalledWith({
        subPath: "test-user-id/api-keys/list",
        additionalHeaders: {
          "X-SGG-Token": "test-token",
        },
        body: {},
      });

      expect(result.status_code).toBe(200);
      expect(result.data).toEqual(mockApiKeys);
    });

    it("returns empty list when no API keys exist", async () => {
      const mockResponse = {
        json: () => Promise.resolve({
          status_code: 200,
          data: [],
          message: "Success",
        }),
      };

      mockFetchUserWithMethod.mockResolvedValue(mockResponse);

      const result = await handleListApiKeys("test-token", "test-user-id");

      expect(result.status_code).toBe(200);
      expect(result.data).toEqual([]);
    });

    it("handles listing failure", async () => {
      const mockResponse = {
        json: () => Promise.resolve({
          status_code: 401,
          message: "Unauthorized",
        }),
      };

      mockFetchUserWithMethod.mockResolvedValue(mockResponse);

      const result = await handleListApiKeys("invalid-token", "test-user-id");

      expect(result.status_code).toBe(401);
      expect(result.message).toBe("Unauthorized");
    });

    it("handles network errors", async () => {
      mockFetchUserWithMethod.mockRejectedValue(new Error("Network error"));

      await expect(
        handleListApiKeys("test-token", "test-user-id")
      ).rejects.toThrow("Network error");
    });
  });

  describe("handleRenameApiKey", () => {
    it("renames an API key successfully", async () => {
      const renamedApiKey = { ...mockApiKey, key_name: "Renamed API Key" };
      const mockResponse = {
        json: () => Promise.resolve({
          status_code: 200,
          data: renamedApiKey,
          message: "Success",
        }),
      };

      mockFetchUserWithMethod.mockResolvedValue(mockResponse);

      const result = await handleRenameApiKey(
        "test-token",
        "test-user-id",
        "test-key-id",
        "Renamed API Key"
      );

      expect(mockFetchUserWithMethod).toHaveBeenCalledWith({
        subPath: "test-user-id/api-keys/test-key-id",
        additionalHeaders: {
          "X-SGG-Token": "test-token",
        },
        body: { key_name: "Renamed API Key" },
      });

      expect(result.status_code).toBe(200);
      expect(result.data).toEqual(renamedApiKey);
    });

    it("handles API key not found", async () => {
      const mockResponse = {
        json: () => Promise.resolve({
          status_code: 404,
          message: "API key not found",
        }),
      };

      mockFetchUserWithMethod.mockResolvedValue(mockResponse);

      const result = await handleRenameApiKey(
        "test-token",
        "test-user-id",
        "invalid-key-id",
        "New Name"
      );

      expect(result.status_code).toBe(404);
      expect(result.message).toBe("API key not found");
    });

    it("handles invalid key name", async () => {
      const mockResponse = {
        json: () => Promise.resolve({
          status_code: 400,
          message: "Invalid key name",
        }),
      };

      mockFetchUserWithMethod.mockResolvedValue(mockResponse);

      const result = await handleRenameApiKey(
        "test-token",
        "test-user-id",
        "test-key-id",
        ""
      );

      expect(result.status_code).toBe(400);
      expect(result.message).toBe("Invalid key name");
    });

    it("handles network errors", async () => {
      mockFetchUserWithMethod.mockRejectedValue(new Error("Network error"));

      await expect(
        handleRenameApiKey("test-token", "test-user-id", "test-key-id", "New Name")
      ).rejects.toThrow("Network error");
    });
  });
});
