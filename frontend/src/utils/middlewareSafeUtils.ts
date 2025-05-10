/*

  Next JS does not allow lodash to be imported into anything in the require tree for middleware functions, due
  to lodash in some very isolated cases using an eval method. See https://github.com/lodash/lodash/issues/5525

  As a result, we should isolate utility functions used within middleware within this file to avoid build errors

*/

export const stringToBoolean = (
  mightRepresentABoolean: string | undefined,
): boolean => mightRepresentABoolean === "true";
