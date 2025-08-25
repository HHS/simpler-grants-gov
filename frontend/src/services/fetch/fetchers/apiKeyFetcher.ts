import { ApiKey } from "src/types/apiKeyTypes";
import { APIResponse } from "src/types/apiResponseTypes";

import { fetchUserWithMethod } from "./fetchers";

interface ApiKeyResponse extends APIResponse {
  data: ApiKey;
}

interface ApiKeyListResponse extends APIResponse {
  data: ApiKey[];
}

// Create a new API key
export const handleCreateApiKey = async (
  token: string,
  userId: string,
  keyName: string,
): Promise<ApiKeyResponse> => {
  const response = await fetchUserWithMethod("POST")({
    subPath: `${userId}/api-keys`,
    additionalHeaders: {
      "X-SGG-Token": token,
    },
    body: { key_name: keyName },
  });
  return (await response.json()) as ApiKeyResponse;
};

// List all API keys for a user
export const handleListApiKeys = async (
  token: string,
  userId: string,
): Promise<ApiKeyListResponse> => {
  const response = await fetchUserWithMethod("POST")({
    subPath: `${userId}/api-keys/list`,
    additionalHeaders: {
      "X-SGG-Token": token,
    },
    body: {},
  });
  return (await response.json()) as ApiKeyListResponse;
};

// Rename an API key
export const handleRenameApiKey = async (
  token: string,
  userId: string,
  apiKeyId: string,
  newName: string,
): Promise<ApiKeyResponse> => {
  const response = await fetchUserWithMethod("PUT")({
    subPath: `${userId}/api-keys/${apiKeyId}`,
    additionalHeaders: {
      "X-SGG-Token": token,
    },
    body: { key_name: newName },
  });
  return (await response.json()) as ApiKeyResponse;
};
