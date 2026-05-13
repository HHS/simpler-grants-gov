"server only";

import {
  fetchLocalUsers,
  fetchUserWithMethod,
} from "src/services/fetch/fetchers/fetchers";
import {
  OrganizationInvitation,
  TestUser,
  UserDetailProfile,
  UserDetailWithProfile,
  UserPrivilegeDefinition,
  UserPrivilegesResponse,
} from "src/types/userTypes";
import { UserPrivilegeRequest } from "src/utils/userPrivileges";

export const getUserDetails = async (
  userId: string,
): Promise<UserDetailWithProfile> => {
  const resp = await fetchUserWithMethod("GET")({
    subPath: userId,
  });
  const json = (await resp.json()) as { data: UserDetailWithProfile };
  return json.data;
};

export const updateUserDetails = async (
  userId: string,
  updates: Record<string, unknown>,
): Promise<UserDetailProfile> => {
  const response = await fetchUserWithMethod("PUT")({
    subPath: `${userId}/profile`,
    body: updates,
  });
  const json = (await response.json()) as { data: UserDetailProfile };
  return json.data;
};

export const getUserPrivileges = async (
  userId: string,
): Promise<UserPrivilegesResponse> => {
  const resp = await fetchUserWithMethod("POST")({
    subPath: `${userId}/privileges`,
  });
  const json = (await resp.json()) as { data: UserPrivilegesResponse };

  return json.data;
};

export const checkUserPrivilege = async (
  userId: string,
  privilegeDefinition: UserPrivilegeDefinition | UserPrivilegeRequest,
): Promise<undefined> => {
  const { privilege, resourceId, resourceType } = privilegeDefinition;
  await fetchUserWithMethod("POST")({
    subPath: `${userId}/can_access`,
    body: {
      resource_type: resourceType,
      resource_id: resourceId,
      privileges: [privilege],
    },
  });
};

export const getUserInvitations = async (
  userId: string,
): Promise<OrganizationInvitation[]> => {
  const resp = await fetchUserWithMethod("POST")({
    subPath: `${userId}/invitations/list`,
  });
  const json = (await resp.json()) as { data: OrganizationInvitation[] };

  return json.data;
};

export const getTestUsers = async (): Promise<TestUser[]> => {
  const resp = await fetchLocalUsers();

  const json = (await resp.json()) as { data: TestUser[] };

  return json.data;
};
