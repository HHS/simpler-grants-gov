"server-only";

import { MissingAuthError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { fetchUserWithMethod } from "src/services/fetch/fetchers/fetchers";
import { PaginationInfo } from "src/types/apiResponseTypes";
import { ApplicationDetail } from "src/types/applicationResponseTypes";

export const APPLICATIONS_PAGE_SIZE = 25;

export interface UserApplicationsPage {
  data: ApplicationDetail[];
  pagination_info: PaginationInfo;
}

const applicationsRequestBody = (pageOffset: number, pageSize: number) => ({
  pagination: {
    page_offset: pageOffset,
    page_size: pageSize,
    sort_order: [
      {
        order_by: "created_at",
        sort_direction: "descending",
      },
    ],
  },
});

const postUserApplications = async (
  userId: string,
  pageOffset: number,
  pageSize: number,
): Promise<UserApplicationsPage> => {
  const resp = await fetchUserWithMethod("POST")({
    subPath: `${userId}/applications`,
    body: applicationsRequestBody(pageOffset, pageSize),
  });
  return (await resp.json()) as UserApplicationsPage;
};

const getUserIdFromSession = async (): Promise<string> => {
  const session = await getSession();
  if (!session?.token) {
    throw new MissingAuthError("No user token present to fetch applications");
  }
  return session.user_id;
};

export const getApplications = async (
  userId: string,
): Promise<ApplicationDetail[]> => {
  const json = await postUserApplications(userId, 1, 5000);
  return json.data;
};

export const fetchApplications = async (): Promise<ApplicationDetail[]> => {
  const userId = await getUserIdFromSession();
  return getApplications(userId);
};

// fetches a single page of the user's applications, newest first
export const fetchApplicationsPage = async (
  page: number,
  pageSize = APPLICATIONS_PAGE_SIZE,
): Promise<UserApplicationsPage> => {
  const userId = await getUserIdFromSession();
  return postUserApplications(userId, page, pageSize);
};
