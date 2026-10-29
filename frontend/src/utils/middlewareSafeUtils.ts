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

export const resolveExternalRequestUrl = (request: NextRequest): string => {
  const host = request.headers.get("host");

  if (!host || !EXTERNAL_HOST_PATTERN.test(host)) {
    return request.url;
  }

  const internalUrl = new URL(request.url);

  return new URL(
    `${internalUrl.protocol}//${host}${internalUrl.pathname}${internalUrl.search}`,
  ).toString();
};
