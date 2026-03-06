"server-only";

import { UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { fetchUserWithMethod } from "src/services/fetch/fetchers/fetchers";

export interface UserAgency {
  agency_id: string;
  agency_name: string;
  agency_code: string;
}

export const getUserAgencies = async (
  token: string,
  userId: string,
): Promise<UserAgency[]> => {
  const subPath = `${userId}/agencies`;
  const resp = await fetchUserWithMethod("POST")({
    subPath,
    additionalHeaders: { "X-SGG-Token": token },
    body: {},
  });
  const json = (await resp.json()) as { data: UserAgency[] };
  return json.data;
};

export const fetchUserAgencies = async (): Promise<UserAgency[]> => {
  const session = await getSession();
  if (!session || !session.token) {
    throw new UnauthorizedError("No active session");
  }
  return getUserAgencies(session.token, session.user_id);
};
