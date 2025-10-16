"server only";

import { ApiRequestError } from "src/errors";
import { JSONRequestBody } from "src/services/fetch/fetcherHelpers";
import {
  fetchUserWithMethod,
  postUserLogout,
} from "src/services/fetch/fetchers/fetchers";
import {
  UserDetailProfile,
  UserDetailWithProfile,
  UserPrivilegeDefinition,
  UserPrivilegesResponse,
} from "src/types/userTypes";

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

// unused, but we may want it later
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
  _token: string,
  _userId: string,
  privilegeDefinition: UserPrivilegeDefinition,
): Promise<unknown> => {
  if (privilegeDefinition.resourceId === "1") {
    return Promise.resolve([]);
  }
  return Promise.reject(new ApiRequestError("", "", 403));
  // const ssgToken = {
  //   "X-SGG-Token": token,
  // };
  // const resp = await fetchUserWithMethod("POST")({
  //   subPath: `${userId}/privileges`,
  //   additionalHeaders: ssgToken,
  // });
  // const json = (await resp.json()) as { data: UserPrivilegesResponse };

  // return json.data;
};
