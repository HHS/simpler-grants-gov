import "server-only";

import { getSession } from "src/services/auth/session";
import { fetchUserWithMethod } from "src/services/fetch/fetchers/fetchers";
import { ApiKey } from "src/types/apiKeyTypes";
import { APIResponse } from "src/types/apiResponseTypes";

export const fetchApiKeys = async (): Promise<ApiKey[]> => {
  const session = await getSession();
  if (!session || !session.token) {
    return [];
  }

  const ssgToken = {
    "X-SGG-Token": session.token,
  };

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

  const subPath = `${session.user_id}/api-keys/list`;
  const resp = await fetchUserWithMethod("POST")({
    subPath,
    additionalHeaders: ssgToken,
    body,
  });

  const json = (await resp.json()) as { data: ApiKey[] };
  return json.data;
};

export const handleListApiKeys = async (
  token: string,
  userId: string,
): Promise<APIResponse> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };

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
    additionalHeaders: ssgToken,
    body,
  });

  return (await resp.json()) as APIResponse;
};

export const handleCreateApiKey = async (
  token: string,
  userId: string,
  keyName: string,
): Promise<APIResponse> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };

  const body = {
    key_name: keyName,
  };

  const subPath = `${userId}/api-keys`;
  const resp = await fetchUserWithMethod("POST")({
    subPath,
    additionalHeaders: ssgToken,
    body,
  });

  return (await resp.json()) as APIResponse;
};

export const handleRenameApiKey = async (
  token: string,
  userId: string,
  apiKeyId: string,
  keyName: string,
): Promise<APIResponse> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };

  const body = {
    key_name: keyName,
  };

  const subPath = `${userId}/api-keys/${apiKeyId}`;
  const resp = await fetchUserWithMethod("PUT")({
    subPath,
    additionalHeaders: ssgToken,
    body,
  });

  return (await resp.json()) as APIResponse;
};

export const handleDeleteApiKey = async (
  token: string,
  userId: string,
  apiKeyId: string,
): Promise<APIResponse> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };

  const subPath = `${userId}/api-keys/${apiKeyId}`;
  const resp = await fetchUserWithMethod("DELETE")({
    subPath,
    additionalHeaders: ssgToken,
  });

  return (await resp.json()) as APIResponse;
};
