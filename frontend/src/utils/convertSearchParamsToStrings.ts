import { ServerSideSearchParams } from "../types/requestURLTypes";

// Search params (query string) coming from the request URL into the server
// can be a string, string[], or undefined.
// Process all of them so they're just a string
export function forceSearchParamsToStringValue(
  params: ServerSideSearchParams,
): {
  [key: string]: string;
} {
  const stringParams: { [key: string]: string } = {};

  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (Array.isArray(value)) {
      // Join array values with a space if we see them
      stringParams[key] = value.join(" ");
    } else {
      stringParams[key] = value || "";
    }
  });

  return stringParams;
}
