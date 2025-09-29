<<<<<<< HEAD
"server only";

import { JSONRequestBody } from "src/services/fetch/fetcherHelpers";
=======
>>>>>>> 6f0a113b7 (wip privileges work)
import {
  fetchUserWithMethod,
  postUserLogout,
} from "src/services/fetch/fetchers/fetchers";
<<<<<<< HEAD
import { UserDetail } from "src/types/userTypes";
=======
import { UserPrivilegesResponse } from "src/types/UserTypes";
>>>>>>> 6f0a113b7 (wip privileges work)

export const postLogout = async (token: string) => {
  const jwtAuthHeader = { "X-SGG-Token": token };
  return postUserLogout({ additionalHeaders: jwtAuthHeader });
};

<<<<<<< HEAD
export const getUserDetails = async (
  token: string,
  userId: string,
): Promise<UserDetail> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const resp = await fetchUserWithMethod("GET")({
    subPath: userId,
    additionalHeaders: ssgToken,
  });
  const json = (await resp.json()) as { data: UserDetail };
  return json.data;
};

export const updateUserDetails = async (
  token: string,
  userId: string,
  updates: JSONRequestBody,
): Promise<UserDetail> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };

  const response = await fetchUserWithMethod("PUT")({
    subPath: `${userId}/profile`,
    additionalHeaders: ssgToken,
    body: updates,
  });
  const json = (await response.json()) as { data: UserDetail };
=======
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
>>>>>>> 6f0a113b7 (wip privileges work)
  return json.data;
};
