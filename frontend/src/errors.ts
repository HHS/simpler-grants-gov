/**
 * @file Custom Error classes. Useful as a way to see all potential errors that our system may throw/catch
 */

import { QueryParamData } from "src/types/search/searchRequestTypes";

export const parseErrorStatus = (error: ApiRequestError): number => {
  const { message } = error;
  try {
    const parsedMessage = JSON.parse(message) as { status: number };
    return parsedMessage.status;
  } catch (e) {
    console.error("Malformed error object");
    return 500;
  }
};

/**
 * A fetch request failed due to a network error. The error wasn't the fault of the user,
 * and an issue was encountered while setting up or sending a request, or parsing the response.
 * Examples of a NetworkError could be the user's device lost internet connection, a CORS issue,
 * or a malformed request.
 */

export class NetworkError extends Error {
  constructor(error: unknown, searchInputs?: QueryParamData) {
    const serializedSearchInputs = searchInputs
      ? convertSearchInputSetsToArrays(searchInputs)
      : {};

    const serializedData = JSON.stringify({
      type: "NetworkError",
      searchInputs: serializedSearchInputs,
      message: error instanceof Error ? error.message : "Unknown Error",
      status: 500,
    });
    super(serializedData);
  }
}

// Used as a base class for all !response.ok errors
export class BaseFrontendError extends Error {
  constructor(
    error: unknown,
    type = "BaseFrontendError",
    status?: number,
    searchInputs?: QueryParamData,
  ) {
    // Sets cannot be properly serialized so convert to arrays first
    const serializedSearchInputs = searchInputs
      ? convertSearchInputSetsToArrays(searchInputs)
      : {};

    const serializedData = JSON.stringify({
      type,
      searchInputs: serializedSearchInputs,
      message: error instanceof Error ? error.message : "Unknown Error",
      status,
    });

    super(serializedData);

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/***************************************************/
/* 400 Errors
/***************************************************/

/**
 * An API response returned a status code greater than 400
 */
export class ApiRequestError extends BaseFrontendError {
  constructor(
    error: unknown,
    type = "APIRequestError",
    status = 400,
    searchInputs?: QueryParamData,
  ) {
    super(error, type, status, searchInputs);
  }
}

/**
 * An API response returned a 400 status code and its JSON body didn't include any `errors`
 */
export class BadRequestError extends ApiRequestError {
  constructor(error: unknown, searchInputs?: QueryParamData) {
    super(error, "BadRequestError", 400, searchInputs);
  }
}

/**
 * An API response returned a 401 status code
 */
export class UnauthorizedError extends ApiRequestError {
  constructor(error: unknown, searchInputs?: QueryParamData) {
    super(error, "UnauthorizedError", 401, searchInputs);
  }
}

/**
 * An API response returned a 403 status code, indicating an issue with the authorization of the request.
 * Examples of a ForbiddenError could be the user's browser prevented the session cookie from
 * being created, or the user hasn't consented to the data sharing agreement.
 */
export class ForbiddenError extends ApiRequestError {
  constructor(error: unknown, searchInputs?: QueryParamData) {
    super(error, "ForbiddenError", 403, searchInputs);
  }
}

/**
 * A fetch request failed due to a 404 error
 */
export class NotFoundError extends ApiRequestError {
  constructor(error: unknown, searchInputs?: QueryParamData) {
    super(error, "NotFoundError", 404, searchInputs);
  }
}

/**
 * An API response returned a 408 status code
 */
export class RequestTimeoutError extends ApiRequestError {
  constructor(error: unknown, searchInputs?: QueryParamData) {
    super(error, "RequestTimeoutError", 408, searchInputs);
  }
}

/**
 * An API response returned a 422 status code
 */
export class ValidationError extends ApiRequestError {
  constructor(error: unknown, searchInputs?: QueryParamData) {
    super(error, "ValidationError", 422, searchInputs);
  }
}

/***************************************************/
/* 500 Errors
/***************************************************/

/**
 * An API response returned a 500 status code
 */
export class InternalServerError extends ApiRequestError {
  constructor(error: unknown, searchInputs?: QueryParamData) {
    super(error, "InternalServerError", 500, searchInputs);
  }
}

/**
 *  An API response returned a 503 status code
 */
export class ServiceUnavailableError extends ApiRequestError {
  constructor(error: unknown, searchInputs?: QueryParamData) {
    super(error, "ServiceUnavailableError", 503, searchInputs);
  }
}

type SearchInputsSimple = {
  [key: string]: string[] | string | number | null | undefined;
};

function convertSearchInputSetsToArrays(
  searchInputs: QueryParamData,
): SearchInputsSimple {
  return {
    ...searchInputs,
    status: searchInputs.status ? Array.from(searchInputs.status) : [],
    fundingInstrument: searchInputs.fundingInstrument
      ? Array.from(searchInputs.fundingInstrument)
      : [],
    eligibility: searchInputs.eligibility
      ? Array.from(searchInputs.eligibility)
      : [],
    agency: searchInputs.agency ? Array.from(searchInputs.agency) : [],
    category: searchInputs.category ? Array.from(searchInputs.category) : [],
    query: searchInputs.query,
    sortby: searchInputs.sortby,
    page: searchInputs.page,
  };
}
