import "server-only";

import { fetchUserWithMethod } from "src/services/fetch/fetchers/fetchers";
import {
  ApiKey,
  ApiKeyResponse,
  CreateApiKeyResponse,
  RenameApiKeyResponse,
} from "src/types/apiKeyTypes";

// The API still returns the full key on list and rename until the hashing
// cutover (#11633), so copy over only the metadata to keep it out of anything
// sent to the browser.
const toApiKeyMetadata = (apiKey: ApiKey): ApiKey => ({
  api_key_id: apiKey.api_key_id,
  key_name: apiKey.key_name,
  created_at: apiKey.created_at,
  last_used: apiKey.last_used,
  is_active: apiKey.is_active,
});

export const handleListApiKeys = async (
  userId: string,
): Promise<ApiKeyResponse> => {
  const body = {
    pagination: {
      page_offset: 1,
      page_size: 25,
      sort_order: [
        {
          order_by: "created_at",
          sort_direction: "descending",
        },
      ],
    },
  };

  const subPath = `${userId}/api-keys/list`;
  const resp = await fetchUserWithMethod("POST")({
    subPath,
    body,
  });

  const response = (await resp.json()) as ApiKeyResponse;
  return response.data
    ? { ...response, data: response.data.map(toApiKeyMetadata) }
    : response;
};

export const handleCreateApiKey = async (
  userId: string,
  keyName: string,
): Promise<CreateApiKeyResponse> => {
  const body = {
    key_name: keyName,
  };

  const subPath = `${userId}/api-keys`;
  const resp = await fetchUserWithMethod("POST")({
    subPath,
    body,
  });

  return (await resp.json()) as CreateApiKeyResponse;
};

export const handleRenameApiKey = async (
  userId: string,
  apiKeyId: string,
  keyName: string,
): Promise<RenameApiKeyResponse> => {
  const body = {
    key_name: keyName,
  };

  const subPath = `${userId}/api-keys/${apiKeyId}`;
  const resp = await fetchUserWithMethod("PUT")({
    subPath,
    body,
  });

  const response = (await resp.json()) as RenameApiKeyResponse;
  return response.data
    ? { ...response, data: toApiKeyMetadata(response.data) }
    : response;
};

export const handleDeleteApiKey = async (
  userId: string,
  apiKeyId: string,
): Promise<ApiKeyResponse> => {
  const subPath = `${userId}/api-keys/${apiKeyId}`;
  const resp = await fetchUserWithMethod("DELETE")({
    subPath,
  });

  return (await resp.json()) as ApiKeyResponse;
};
