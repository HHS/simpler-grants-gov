import { readError } from "src/errors";
import { searchAgenciesForFilterOptions } from "src/services/fetch/fetchers/agenciesFetcher";
import { FilterOption } from "src/types/search/searchFilterTypes";

import { NextRequest } from "next/server";

export async function searchForAgencies(request: NextRequest) {
  const { keyword } = (await request.json()) as { keyword: string | undefined };

  if (!keyword) {
    throw new Error("No agency search keyword provided");
  }

  let agencySearchResults: FilterOption[] = [];
  try {
    agencySearchResults = await searchAgenciesForFilterOptions(keyword);
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    console.error(e);
    return Response.json(
      {
        message: `Error attempting to fetch agency filter options: ${message}`,
      },
      { status },
    );
  }

  return Response.json(agencySearchResults);
}
