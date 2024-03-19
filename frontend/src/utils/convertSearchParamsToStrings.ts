import { SearchFetcherProps } from "../services/search/searchfetcher/SearchFetcher";
import { ServerSideSearchParams } from "../types/searchRequestURLTypes";

// Search params (query string) coming from the request URL into the server
// can be a string, string[], or undefined.
// Process all of them so they're just a string (or number for page)
export function convertSearchParamsToProperTypes(
  params: ServerSideSearchParams,
): SearchFetcherProps {
  return {
    ...params,
    query: params.query || "", // Convert empty string to null if needed
    status: paramToSet(params.status),
    agency: paramToSet(params.agency),
    fundingInstrument: paramToSet(params.fundingInstrument),
    sortby: params.sortby || null, // Convert empty string to null if needed
    // Ensure page is at least 1 or default to 1 if undefined
    page: Math.max(1, parseInt(params.page || "1")),
  }; // Type assertion since we know the structure matches
}

// Helper function to convert query parameters to set
function paramToSet(param: string | string[] | undefined): Set<string> {
  if (!param) return new Set();
  if (Array.isArray(param)) {
    return new Set(param);
  }
  return new Set(param.split(","));
}
