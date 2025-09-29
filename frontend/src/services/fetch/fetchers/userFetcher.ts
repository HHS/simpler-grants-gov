import {
  fetchUserWithMethod,
  postUserLogout,
} from "src/services/fetch/fetchers/fetchers";
import { UserPrivilegesResponse } from "src/types/UserTypes";

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
