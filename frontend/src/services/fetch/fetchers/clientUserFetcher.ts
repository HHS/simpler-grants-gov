"use client";

import { ApiRequestError } from "src/errors";
import { UserFetcher, UserSession } from "src/services/auth/types";

// this fetcher is a one off for now, since the request is made from the client to the
// NextJS Node server. We will need to build out a fetcher pattern to accomodate this usage in the future
export const userFetcher: UserFetcher = async (url) => {
  let response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch (e) {
    const error = e as Error;
    console.error("User session fetch network error", e);
    throw new ApiRequestError(error.message, "NetworkError", 0); // Network error
  }
  if (response.status === 204) return undefined;
  if (response.ok) return (await response.json()) as UserSession;
  throw new ApiRequestError(
    "Unknown error fetching user",
    undefined,
    response.status,
  );
};
