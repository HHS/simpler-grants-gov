import {
  createApiKeyEndpoint,
  createApiKeyRequestConfig,
  deleteApiKeyEndpoint,
  deleteApiKeyRequestConfig,
  getApiKeysEndpoint,
  getApiKeysRequestConfig,
  renameApiKeyEndpoint,
  renameApiKeyRequestConfig,
} from "src/services/fetch/fetchers/apiKeyClientHelpers";

describe("apiKeyClientHelpers", () => {
  describe("getApiKeysEndpoint", () => {
    it("returns the correct endpoint for listing API keys", () => {
      const endpoint = getApiKeysEndpoint();
      expect(endpoint).toBe("/api/user/api-keys/list");
    });
  });

  describe("getApiKeysRequestConfig", () => {
    it("returns the correct request configuration for listing API keys", () => {
      const config = getApiKeysRequestConfig();

      expect(config).toEqual({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
    });
  });

  describe("createApiKeyEndpoint", () => {
    it("returns the correct endpoint for creating API keys", () => {
      const endpoint = createApiKeyEndpoint();
      expect(endpoint).toBe("/api/user/api-keys");
    });
  });

  describe("createApiKeyRequestConfig", () => {
    it("returns the correct request configuration for creating API keys", () => {
      const keyName = "Test API Key";
      const config = createApiKeyRequestConfig(keyName);

      expect(config).toEqual({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key_name: keyName }),
      });
    });

    it("handles empty key name", () => {
      const config = createApiKeyRequestConfig("");

      expect(config).toEqual({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key_name: "" }),
      });
    });

    it("handles special characters in key name", () => {
      const keyName = "Test API Key! @#$%^&*()";
      const config = createApiKeyRequestConfig(keyName);

      expect(config).toEqual({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key_name: keyName }),
      });
    });
  });

  describe("renameApiKeyEndpoint", () => {
    it("returns the correct endpoint for renaming API keys", () => {
      const apiKeyId = "test-key-id";
      const endpoint = renameApiKeyEndpoint(apiKeyId);
      expect(endpoint).toBe("/api/user/api-keys/test-key-id");
    });

    it("handles empty API key ID", () => {
      const endpoint = renameApiKeyEndpoint("");
      expect(endpoint).toBe("/api/user/api-keys/");
    });

    it("handles special characters in API key ID", () => {
      const apiKeyId = "test-key-id-123_abc";
      const endpoint = renameApiKeyEndpoint(apiKeyId);
      expect(endpoint).toBe("/api/user/api-keys/test-key-id-123_abc");
    });
  });

  describe("renameApiKeyRequestConfig", () => {
    it("returns the correct request configuration for renaming API keys", () => {
      const newName = "Renamed API Key";
      const config = renameApiKeyRequestConfig(newName);

      expect(config).toEqual({
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key_name: newName }),
      });
    });

    it("handles empty new name", () => {
      const config = renameApiKeyRequestConfig("");

      expect(config).toEqual({
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key_name: "" }),
      });
    });

    it("handles special characters in new name", () => {
      const newName = "Renamed API Key! @#$%^&*()";
      const config = renameApiKeyRequestConfig(newName);

      expect(config).toEqual({
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key_name: newName }),
      });
    });
  });

  describe("deleteApiKeyEndpoint", () => {
    it("returns the correct endpoint for deleting API keys", () => {
      const apiKeyId = "test-key-id";
      const endpoint = deleteApiKeyEndpoint(apiKeyId);
      expect(endpoint).toBe("/api/user/api-keys/test-key-id");
    });

    it("handles empty API key ID", () => {
      const endpoint = deleteApiKeyEndpoint("");
      expect(endpoint).toBe("/api/user/api-keys/");
    });

    it("handles special characters in API key ID", () => {
      const apiKeyId = "test-key-id-123_abc";
      const endpoint = deleteApiKeyEndpoint(apiKeyId);
      expect(endpoint).toBe("/api/user/api-keys/test-key-id-123_abc");
    });

    it("handles UUID format API key IDs", () => {
      const apiKeyId = "550e8400-e29b-41d4-a716-446655440000";
      const endpoint = deleteApiKeyEndpoint(apiKeyId);
      expect(endpoint).toBe(
        "/api/user/api-keys/550e8400-e29b-41d4-a716-446655440000",
      );
    });
  });

  describe("deleteApiKeyRequestConfig", () => {
    it("returns the correct request configuration for deleting API keys", () => {
      const config = deleteApiKeyRequestConfig();

      expect(config).toEqual({
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
    });

    it("returns consistent configuration on multiple calls", () => {
      const config1 = deleteApiKeyRequestConfig();
      const config2 = deleteApiKeyRequestConfig();

      expect(config1).toEqual(config2);
    });

    it("returns object with correct method", () => {
      const config = deleteApiKeyRequestConfig();
      expect(config.method).toBe("DELETE");
    });

    it("returns object with correct headers", () => {
      const config = deleteApiKeyRequestConfig();
      expect(config.headers).toEqual({
        "Content-Type": "application/json",
      });
    });

    it("does not include body in delete request", () => {
      const config = deleteApiKeyRequestConfig();
      expect(config).not.toHaveProperty("body");
    });
  });
});
