"server only";

import {
  fetchUserWithMethod,
  postUserLogout,
} from "src/services/fetch/fetchers/fetchers";
import {
  DynamicUserDetails,
  UserDetail,
  UserPrivilegesResponse,
} from "src/types/userTypes";
import { fakeUser } from "src/utils/testing/fixtures";

export const postLogout = async (token: string) => {
  const jwtAuthHeader = { "X-SGG-Token": token };
  return postUserLogout({ additionalHeaders: jwtAuthHeader });
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
export const getUserDetails = async (
  _token: string,
  _userId: string,
): Promise<UserDetail> => {
  return Promise.resolve(fakeUser);

  // uncomment this once the API changes to add support for names are implemented

  // const ssgToken = {
  //   "X-SGG-Token": token,
  // };
  // const resp = await fetchUserWithMethod("GET")({
  //   subPath: userId,
  //   additionalHeaders: ssgToken,
  // });
  // const json = (await resp.json()) as { data: UserDetail };
  // return json.data;
};

export const updateUserDetails = async (
  _token: string,
  updates: DynamicUserDetails,
): Promise<UserDetail> => {
  return Promise.resolve({ ...fakeUser, ...updates } as UserDetail);
  // uncomment this once the API changes to add support for names are implemented

  // const ssgToken = {
  //   "X-SGG-Token": token,
  // };

  // return fetchUserWithMethod("PUT")({
  //   subPath: userId,
  //   additionalHeaders: ssgToken,
  //   body: payload,
  // });
};
