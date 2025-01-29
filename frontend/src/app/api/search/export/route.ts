import { downloadOpportunities } from "src/services/fetch/fetchers/searchFetcher";
import { convertSearchParamsToProperTypes } from "src/utils/search/convertSearchParamsToProperTypes";

import { NextRequest } from "next/server";

export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = convertSearchParamsToProperTypes(
      Object.fromEntries(request.nextUrl.searchParams.entries().toArray()),
    );
    const apiResponse = await downloadOpportunities(searchParams);
    return new Response(apiResponse, {
      headers: {
        "Content-Type": "text/csv",
      },
    });
  } catch (e) {
    console.error("Error downloading search results", e);
    throw e;
  }
}
