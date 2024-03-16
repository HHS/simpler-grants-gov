import {
  ConvertedSearchParams,
  ServerSideSearchParams,
} from "../types/requestURLTypes";


// Search params (query string) coming from the request URL into the server
// can be a string, string[], or undefined.
// Process all of them so they're just a string
export function convertSearchParamsToProperTypes(
  params: ServerSideSearchParams,
): ConvertedSearchParams {
  return {
    ...params,
    // Ensure page is at least 1 or default to 1 if undefined
    page: Math.max(1, parseInt(params.page || "1")),
  } as ConvertedSearchParams; // Type assertion since we know the structure matches
}
