"server only";

import {
  fetchUserWithMethod,
  postUserLogout,
} from "src/services/fetch/fetchers/fetchers";
import { UserDetail } from "src/types/userTypes";
import { fakeUser } from "src/utils/testing/fixtures";

export const postLogout = async (token: string) => {
  const jwtAuthHeader = { "X-SGG-Token": token };
  return postUserLogout({ additionalHeaders: jwtAuthHeader });
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
