"server only";

import { JSONRequestBody } from "src/services/fetch/fetcherHelpers";
import {
  fetchLocalUsers,
  fetchUserWithMethod,
  postUserLogout,
} from "src/services/fetch/fetchers/fetchers";
import {
  OrganizationInvitation,
  TestUser,
  UserDetailProfile,
  UserDetailWithProfile,
  UserPrivilegeDefinition,
  UserPrivilegesResponse,
} from "src/types/userTypes";
import { fakeOrganizationInvitation } from "src/utils/testing/fixtures";

export const postLogout = async (token: string) => {
  const jwtAuthHeader = { "X-SGG-Token": token };
  return postUserLogout({ additionalHeaders: jwtAuthHeader });
};

export const getUserDetails = async (
  token: string,
  userId: string,
): Promise<UserDetailWithProfile> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const resp = await fetchUserWithMethod("GET")({
    subPath: userId,
    additionalHeaders: ssgToken,
  });
  const json = (await resp.json()) as { data: UserDetailWithProfile };
  return json.data;
};

export const updateUserDetails = async (
  token: string,
  userId: string,
  updates: JSONRequestBody,
): Promise<UserDetailProfile> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };

  const response = await fetchUserWithMethod("PUT")({
    subPath: `${userId}/profile`,
    additionalHeaders: ssgToken,
    body: updates,
  });
  const json = (await response.json()) as { data: UserDetailProfile };
  return json.data;
};

export const getUserPrivileges = async (
  token: string,
  userId: string,
): Promise<UserPrivilegesResponse> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const resp = await fetchUserWithMethod("POST")({
    subPath: `${userId}/privileges`,
    additionalHeaders: ssgToken,
  });
  const json = (await resp.json()) as { data: UserPrivilegesResponse };

  return json.data;
};

export const checkUserPrivilege = async (
  token: string,
  userId: string,
  privilegeDefinition: UserPrivilegeDefinition,
): Promise<undefined> => {
  const { privilege, resourceId, resourceType } = privilegeDefinition;
  const ssgToken = {
    "X-SGG-Token": token,
  };
  await fetchUserWithMethod("POST")({
    subPath: `${userId}/can_access`,
    additionalHeaders: ssgToken,
    body: {
      resource_type: resourceType,
      resource_id: resourceId,
      privileges: [privilege],
    },
  });
};

export const getUserInvitations = async (
  _token: string,
  _userId: string,
): Promise<OrganizationInvitation[]> => {
  return Promise.resolve([fakeOrganizationInvitation]);
  // const ssgToken = {
  //   "X-SGG-Token": token,
  // };
  // const resp = await fetchUserWithMethod("POST")({
  //   subPath: `${userId}/invitations/list`,
  //   additionalHeaders: ssgToken,
  // });
  // const json = (await resp.json()) as { data: OrganizationInvitation[] };

  // return json.data;
};

export const getTestUsers = async (): Promise<TestUser[]> => {
  const resp = await fetchLocalUsers();

  const json = (await resp.json()) as { data: TestUser[] };

  return json.data;
};
