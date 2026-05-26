import "server-only";

import { fetchUserWithMethod } from "src/services/fetch/fetchers/fetchers";
import { APIResponse } from "src/types/apiResponseTypes";

export const handleListApiKeys = async (
  userId: string,
): Promise<APIResponse> => {
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

  return (await resp.json()) as APIResponse;
};

export const handleCreateApiKey = async (
  userId: string,
  keyName: string,
): Promise<APIResponse> => {
  const body = {
    key_name: keyName,
  };

  const subPath = `${userId}/api-keys`;
  const resp = await fetchUserWithMethod("POST")({
    subPath,
    body,
  });

  return (await resp.json()) as APIResponse;
};

export const handleRenameApiKey = async (
  userId: string,
  apiKeyId: string,
  keyName: string,
): Promise<APIResponse> => {
  const body = {
    key_name: keyName,
  };

  const subPath = `${userId}/api-keys/${apiKeyId}`;
  const resp = await fetchUserWithMethod("PUT")({
    subPath,
    body,
  });

  return (await resp.json()) as APIResponse;
};

export const handleDeleteApiKey = async (
  userId: string,
  apiKeyId: string,
): Promise<APIResponse> => {
  const subPath = `${userId}/api-keys/${apiKeyId}`;
  const resp = await fetchUserWithMethod("DELETE")({
    subPath,
  });

  return (await resp.json()) as APIResponse;
};
