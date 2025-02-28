import { ApiRequestError, readError, UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { QueryParamData } from "src/types/search/searchRequestTypes";
import { formatSearchRequestBody } from "src/utils/search/searchFormatUtils";

// import { handleSavedOpportunity } from "src/services/fetch/fetchers/savedOpportunityFetcher";

export const POST = async (request: Request) => {
  try {
    const session = await getSession();
    if (!session || !session.token) {
      throw new UnauthorizedError("No active session to save opportunity");
    }
    const savedSearchParamsFromBody: QueryParamData = await request.json();

    // right now this is only returning pagination, not sure why
    const savedSearch = formatSearchRequestBody(savedSearchParamsFromBody);

    savedSearch.pagination.page_offset = 1;

    // const response = await handleSavedSearch(
    //   session.token,
    //   session.user_id as string,
    //   savedSearch,
    // );
    // const res = (await response.json()) as {
    //   status_code: number;
    //   message: string;
    // };
    // if (!res || res.status_code !== 200) {
    //   throw new ApiRequestError(
    //     `Error ${request.method} saved opportunity: ${res.message}`,
    //     "APIRequestError",
    //     res.status_code,
    //   );
    // }
    return Response.json({
      message: `Saved search success`,
      TESTING_SAVED_SEARCH_FORMAT: savedSearch,
      savedSearches: [], // tbd but will potentially be useful when updating the list after save
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error attempting to save search: ${message}`,
      },
      { status },
    );
  }
};
