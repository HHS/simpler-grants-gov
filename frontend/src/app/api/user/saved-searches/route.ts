import { omit } from "lodash";
import {
  ApiRequestError,
  BadRequestError,
  readError,
  UnauthorizedError,
} from "src/errors";
import { getSession } from "src/services/auth/session";
import { handleSavedSearch } from "src/services/fetch/fetchers/savedSearchFetcher";
import { OptionalStringDict } from "src/types/generalTypes";
import { convertSearchParamsToProperTypes } from "src/utils/search/convertSearchParamsToProperTypes";
import { formatSearchRequestBody } from "src/utils/search/searchFormatUtils";

export const POST = async (request: Request) => {
  try {
    const session = await getSession();
    if (!session || !session.token) {
      throw new UnauthorizedError("No active session to save opportunity");
    }
    const savedSearchBody = (await request.json()) as OptionalStringDict;

    if (!savedSearchBody.name) {
      throw new BadRequestError("No name supplied for saved search");
    }

    const convertedParams = convertSearchParamsToProperTypes(
      omit(savedSearchBody, "name"),
    );
    const savedSearch = formatSearchRequestBody(convertedParams);

    savedSearch.pagination.page_offset = 1;

    const response = await handleSavedSearch(
      session.token,
      session.user_id as string,
      savedSearch,
      savedSearchBody.name,
    );
    if (!response || response.status_code !== 200) {
      throw new ApiRequestError(
        `Error ${request.method} saved opportunity: ${response.message}`,
        "APIRequestError",
        response.status_code,
      );
    }
    return Response.json({
      message: "Saved search success",
      TESTING_SAVED_SEARCH_FORMAT: savedSearch,
      savedSearches: response.data, // tbd but will potentially be useful when updating the list after save
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
