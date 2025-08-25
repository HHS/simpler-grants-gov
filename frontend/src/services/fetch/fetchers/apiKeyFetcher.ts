import { getSession } from "src/services/auth/session";
import { APIResponse } from "src/types/apiResponseTypes";
import { ApiKey } from "src/types/apiTypes";

import { fetchUserWithMethod } from "./fetchers";

export interface ApiKeyData {
  api_key_id: string;
  key_name: string;
  key_id: string;
  created_at: string;
  last_used: string | null;
  is_active: boolean;
}

interface ApiKeyResponse extends APIResponse {
  data: ApiKeyData;
}

interface ApiKeyListResponse extends APIResponse {
  data: ApiKeyData[];
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

// Fetch API keys for a user (server-side)
export const fetchApiKeys = async (): Promise<ApiKey[]> => {
  const session = await getSession();
  if (!session || !session.token) {
    return [];
  }
  
  const response = await fetchUserWithMethod("POST")({
    subPath: `${session.user_id}/api-keys/list`,
    additionalHeaders: {
      "X-SGG-Token": session.token,
    },
    body: {},
  });
  
  const json = (await response.json()) as ApiKeyListResponse;
  return json.data;
};

// Client-side API key fetching helper for use with useClientFetch
export const getApiKeysEndpoint = () => "/api/user/api-keys/list";

export const getApiKeysRequestConfig = () => ({
  method: "POST" as const,
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({}),
});
