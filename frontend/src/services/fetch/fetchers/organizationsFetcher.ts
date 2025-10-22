import { Organization } from "src/types/applicationResponseTypes";
import { UserDetail, UserRole } from "src/types/userTypes";

import { fetchOrganizationWithMethod, fetchUserWithMethod } from "./fetchers";

export const getOrganizationDetails = async (
  token: string,
  organizationId: string,
): Promise<Organization> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const resp = await fetchOrganizationWithMethod("GET")({
    subPath: organizationId,
    additionalHeaders: ssgToken,
  });
  const json = (await resp.json()) as { data: Organization };
  return json.data;
};

export const getUserOrganizations = async (
  token: string,
  userId: string,
): Promise<Organization[]> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const resp = await fetchUserWithMethod("GET")({
    subPath: `${userId}/organizations`,
    additionalHeaders: ssgToken,
  });
  const json = (await resp.json()) as { data: Organization[] };
  return json.data;
};

export const getOrganizationUsers = async (
  token: string,
  organizationId: string,
): Promise<UserDetail[]> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const resp = await fetchOrganizationWithMethod("POST")({
    subPath: `${organizationId}/users`,
    additionalHeaders: ssgToken,
  });
  const json = (await resp.json()) as { data: UserDetail[] };
  return json.data;
};

export const getOrganizationRoles = async (
  token: string,
  organizationId: string,
): Promise<UserRole[]> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const resp = await fetchOrganizationWithMethod("POST")({
    subPath: `${organizationId}/roles/list`,
    additionalHeaders: ssgToken,
  });
  const json = (await resp.json()) as { data: UserRole[] };
  return json.data;
};

export const updateOrganizationUserRoles = async (
  token: string,
  organizationId: string,
  userId: string,
  roleIds: string[],
): Promise<UserDetail> => {
  const resp = await fetchOrganizationWithMethod("PUT")({
    subPath: `${organizationId}/users/${userId}`,
    additionalHeaders: { "X-SGG-TOKEN": token },
    body: { role_ids: roleIds },
  });
  const json = (await resp.json()) as { data: UserDetail };
  return json.data;
};
