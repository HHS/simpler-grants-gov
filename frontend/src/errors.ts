/**
 * @file Custom Error classes. Useful as a way to see all potential errors that our system may throw/catch
 * Note that the errors defined here rely on stringifying JSON data into the Error's message parameter
 * That data will need to be parsed back out into JSON when reading the error
 */
import { FrontendErrorDetails } from "src/types/apiResponseTypes";
import { QueryParamData } from "src/types/search/searchRequestTypes";

export const parseErrorStatus = (error: ApiRequestError): number => {
  const { message } = error;
  const cause = error.cause as FrontendErrorDetails;

  try {
    if (cause?.status) {
      return cause.status;
    }
    const parsedMessage = JSON.parse(message) as { status: number };
    return parsedMessage.status;
  } catch (e) {
    console.error("Malformed error object", e);
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
    const message = error instanceof Error ? error.message : "Unknown Error";
    const cause = {
      type: "NetworkError",
      searchInputs: serializedSearchInputs,
      message,
      status: 500,
    };
    super(message, { cause });
  }
}

// Used as a base class for all !response.ok errors
export class BaseFrontendError extends Error {
  constructor(
    message: string,
    type = "BaseFrontendError",
    details?: FrontendErrorDetails,
  ) {
    const { searchInputs, status, ...additionalDetails } = details || {};
    // Sets cannot be properly serialized so convert to arrays first
    const serializedSearchInputs = searchInputs
      ? convertSearchInputSetsToArrays(searchInputs)
      : {};

    const cause = {
      type,
      searchInputs: serializedSearchInputs,
      message: message || "Unknown Error",
      status,
      details: additionalDetails,
    };

    super(message || "Unknown Error", { cause });

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
    message: string,
    type = "APIRequestError",
    status = 400,
    details?: FrontendErrorDetails,
  ) {
    super(message, type, { status, ...details });
  }
}

/**
 * An API response returned a 400 status code and its JSON body didn't include any `errors`
 */
export class BadRequestError extends ApiRequestError {
  constructor(message: string, details?: FrontendErrorDetails) {
    super(message, "BadRequestError", 400, details);
  }
}

/**
 * An API response returned a 401 status code for failed authentication
 */
export class UnauthorizedError extends ApiRequestError {
  constructor(message: string, details?: FrontendErrorDetails) {
    super(message, "UnauthorizedError", 401, details);
  }
}

/**
 * An API response returned a 403 status code, indicating an issue with the authorization of the request.
 * Examples of a ForbiddenError could be the user's browser prevented the session cookie from
 * being created, or the user hasn't consented to the data sharing agreement.
 */
export class ForbiddenError extends ApiRequestError {
  constructor(message: string, details?: FrontendErrorDetails) {
    super(message, "ForbiddenError", 403, details);
  }
}

/**
 * A fetch request failed due to a 404 error
 */
export class NotFoundError extends ApiRequestError {
  constructor(message: string, details?: FrontendErrorDetails) {
    super(message, "NotFoundError", 404, details);
  }
}

/**
 * An API response returned a 408 status code
 */
export class RequestTimeoutError extends ApiRequestError {
  constructor(message: string, details?: FrontendErrorDetails) {
    super(message, "RequestTimeoutError", 408, details);
  }
}

/**
 * An API response returned a 422 status code
 */
export class ValidationError extends ApiRequestError {
  constructor(message: string, details?: FrontendErrorDetails) {
    super(message, "ValidationError", 422, details);
  }
}

/***************************************************/
/* 500 Errors
/***************************************************/

/**
 * An API response returned a 500 status code
 */
export class InternalServerError extends ApiRequestError {
  constructor(message: string, details?: FrontendErrorDetails) {
    super(message, "InternalServerError", 500, details);
  }
}

/**
 *  An API response returned a 503 status code
 */
export class ServiceUnavailableError extends ApiRequestError {
  constructor(message: string, details?: FrontendErrorDetails) {
    super(message, "ServiceUnavailableError", 503, details);
  }
}

type SearchInputsSimple = {
  [key: string]: string[] | string | number | null | undefined;
};

// Is this still being used? Can we get rid of this?
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
    assistanceListingNumber: searchInputs.assistanceListingNumber
      ? Array.from(searchInputs.assistanceListingNumber)
      : [],
    category: searchInputs.category ? Array.from(searchInputs.category) : [],
    closeDate: searchInputs.closeDate ? Array.from(searchInputs.closeDate) : [],
    postedDate: searchInputs.postedDate
      ? Array.from(searchInputs.postedDate)
      : [],
    costSharing: searchInputs.costSharing
      ? Array.from(searchInputs.costSharing)
      : [],
    topLevelAgency: searchInputs.topLevelAgency
      ? Array.from(searchInputs.topLevelAgency)
      : [],
    query: searchInputs.query,
    sortby: searchInputs.sortby,
    page: searchInputs.page,
  };
}

// Helper function to read error details
export const readError = (e: Error, defaultStatus: number) => {
  const { message, cause } = e;
  const status =
    cause && typeof cause === "object" && "status" in cause
      ? cause.status
      : defaultStatus;

  return {
    status: Number(status),
    message,
    cause: cause as FrontendErrorDetails,
  };
};
