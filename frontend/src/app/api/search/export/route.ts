import { searchForOpportunities } from "src/services/fetch/fetchers/searchFetcher";
import { convertSearchParamsToProperTypes } from "src/utils/search/convertSearchParamsToProperTypes";

import { NextRequest } from "next/server";

export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = convertSearchParamsToProperTypes(
      Object.fromEntries(request.nextUrl.searchParams.entries().toArray()),
    );
    const response = await searchForOpportunities(searchParams, true);
    return response;
  } catch (e) {
    console.error("Error downloading search results", e);
    throw e;
  }
}
