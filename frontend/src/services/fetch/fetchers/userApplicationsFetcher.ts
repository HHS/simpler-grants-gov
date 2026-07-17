"server-only";

import { MissingAuthError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { fetchUserWithMethod } from "src/services/fetch/fetchers/fetchers";
import { ApplicationDetail } from "src/types/applicationResponseTypes";

export const getApplications = async (
  userId: string,
): Promise<ApplicationDetail[]> => {
  const body = {
    pagination: {
      page_offset: 1,
      page_size: 5000,
      sort_order: [
        {
          order_by: "created_at",
          sort_direction: "descending",
        },
      ],
    },
  };
  const subPath = `${userId}/applications`;
  const resp = await fetchUserWithMethod("POST")({
    subPath,
    body,
  });
  const json = (await resp.json()) as { data: [] };
  return json.data;
};

export const fetchApplications = async (): Promise<ApplicationDetail[]> => {
  const session = await getSession();
  if (!session?.token) {
    throw new MissingAuthError("No user token present to fetch applications");
  }
  return getApplications(session.user_id);
};
