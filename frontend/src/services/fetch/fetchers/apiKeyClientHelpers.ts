// Client-side API key fetching helpers for use with useClientFetch

export const getApiKeysEndpoint = () => "/api/user/api-keys/list";

export const getApiKeysRequestConfig = () => ({
  method: "POST" as const,
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({}),
});

export const createApiKeyEndpoint = () => "/api/user/api-keys";

export const createApiKeyRequestConfig = (keyName: string) => ({
  method: "POST" as const,
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ key_name: keyName }),
});

export const renameApiKeyEndpoint = (apiKeyId: string) =>
  `/api/user/api-keys/${apiKeyId}`;

export const renameApiKeyRequestConfig = (keyName: string) => ({
  method: "PUT" as const,
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ key_name: keyName }),
});

export const deleteApiKeyEndpoint = (apiKeyId: string) =>
  `/api/user/api-keys/${apiKeyId}`;

export const deleteApiKeyRequestConfig = () => ({
  method: "DELETE" as const,
  headers: {
    "Content-Type": "application/json",
  },
});
