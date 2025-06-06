import { omit } from "lodash";
import {
  ApiRequestError,
  BadRequestError,
  readError,
  UnauthorizedError,
} from "src/errors";
import { getSession } from "src/services/auth/session";
import {
  handleDeleteSavedSearch,
  handleSavedSearch,
  handleUpdateSavedSearch,
} from "src/services/fetch/fetchers/savedSearchFetcher";
import { OptionalStringDict } from "src/types/generalTypes";
import { formatSearchRequestBody } from "src/utils/search/searchFormatUtils";
import { convertSearchParamsToProperTypes } from "src/utils/search/searchUtils";

export const saveSearchHandler = async (request: Request) => {
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

export const deleteSearchHandler = async (request: Request) => {
  try {
    const session = await getSession();
    if (!session || !session.token) {
      throw new UnauthorizedError("No active session to save opportunity");
    }
    // using a body on a delete request technically works but isn't to spec. Doing it for now, but
    // will fix this up to take the id as a path param later on
    const savedSearchBody = (await request.json()) as OptionalStringDict;

    if (!savedSearchBody.searchId) {
      throw new BadRequestError("No search id provided to delete saved search");
    }

    const response = await handleDeleteSavedSearch(
      session.token,
      session.user_id,
      savedSearchBody.searchId,
    );
    if (!response || response.status_code !== 200) {
      throw new ApiRequestError(
        `Error deleting search: ${response.message}`,
        "APIRequestError",
        response.status_code,
      );
    }
    return Response.json({
      message: "Delete search success",
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error attempting to delete search: ${message}`,
      },
      { status },
    );
  }
};

export const updateSavedSearchHandler = async (request: Request) => {
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
