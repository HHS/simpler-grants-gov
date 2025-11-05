"server-only";

import { UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { fetchUserWithMethod } from "src/services/fetch/fetchers/fetchers";
import { ApplicationDetail } from "src/types/applicationResponseTypes";

export const getApplications = async (
  token: string,
  userId: string,
): Promise<ApplicationDetail[]> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const body = {
    pagination: {
      page_offset: 1,
      page_size: 5000,
    },
  };
  const subPath = `${userId}/applications`;
  const resp = await fetchUserWithMethod("POST")({
    subPath,
    additionalHeaders: ssgToken,
    body,
  });
  const json = (await resp.json()) as { data: [] };
  return json.data;
};

export const fetchApplications = async (): Promise<ApplicationDetail[]> => {
  const session = await getSession();
  if (!session || !session.token) {
    // we shouldn't get there because the page should be checking authentication
    throw new UnauthorizedError("No active session");
  }
  const applications = await getApplications(session.token, session.user_id);
  return applications;
};
