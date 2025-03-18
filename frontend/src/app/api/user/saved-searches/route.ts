import { omit } from "lodash";
import {
  ApiRequestError,
  BadRequestError,
  readError,
  UnauthorizedError,
} from "src/errors";
import { getSession } from "src/services/auth/session";
import {
  handleSavedSearch,
  handleUpdateSavedSearch,
} from "src/services/fetch/fetchers/savedSearchFetcher";
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

    // always save searches pointing first page of results
    savedSearch.pagination.page_offset = 1;

    const response = await handleSavedSearch(
      session.token,
      session.user_id,
      savedSearch,
      savedSearchBody.name,
    );
    if (!response || response.status_code !== 200) {
      throw new ApiRequestError(
        `Error saving search: ${response.message}`,
        "APIRequestError",
        response.status_code,
      );
    }
    return Response.json({
      message: "Saved search success",
      id: response?.data?.saved_search_id,
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

export const PUT = async (request: Request) => {
  try {
    const session = await getSession();
    if (!session || !session.token) {
      throw new UnauthorizedError("No active session to save opportunity");
    }
    const savedSearchBody = (await request.json()) as OptionalStringDict;

    if (!savedSearchBody.name || !savedSearchBody.searchId) {
      throw new BadRequestError(
        "Necessary fields not supplied to update saved search",
      );
    }

    const response = await handleUpdateSavedSearch(
      session.token,
      session.user_id,
      savedSearchBody.searchId,
      savedSearchBody.name,
    );
    if (!response || response.status_code !== 200) {
      throw new ApiRequestError(
        `Error updating search: ${response.message}`,
        "APIRequestError",
        response.status_code,
      );
    }
    return Response.json({
      message: "Update search success",
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
