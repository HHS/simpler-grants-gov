/*

  Next JS does not allow lodash to be imported into anything in the require tree for middleware functions, due
  to lodash in some very isolated cases using an eval method. See https://github.com/lodash/lodash/issues/5525

  As a result, we should isolate utility functions used within middleware within this file to avoid build errors

*/

import { NextRequest } from "next/server";

export const stringToBoolean = (
  mightRepresentABoolean: string | undefined,
): boolean => mightRepresentABoolean === "true";

const EXTERNAL_HOST_PATTERN = /^[a-zA-Z0-9.-]+(:\d{1,5})?$/;

const redactToken = (url: URL): string => {
  if (url.searchParams.has("token")) {
    url.searchParams.set("token", "REDACTED");
  }
  return url.toString();
};

// resolves the URL for request logging, with any token query param redacted
export const resolveExternalRequestUrl = (request: NextRequest): string => {
  const host = request.headers.get("host");
  const internalUrl = new URL(request.url);

  if (!host || !EXTERNAL_HOST_PATTERN.test(host)) {
    return redactToken(internalUrl);
  }

  return redactToken(
    new URL(
      `${internalUrl.protocol}//${host}${internalUrl.pathname}${internalUrl.search}`,
    ),
  );
};
