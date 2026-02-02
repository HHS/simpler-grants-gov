import { readError } from "src/errors";
import { searchAndFlattenAgencies } from "src/services/fetch/fetchers/agenciesFetcher";
import { RelevantAgencyRecord } from "src/types/search/searchFilterTypes";

import { NextRequest } from "next/server";

export async function searchForAgencies(request: NextRequest) {
  const { keyword, selectedStatuses } = (await request.json()) as {
    keyword?: string;
    selectedStatuses?: string[];
  };

  let agencySearchResults: RelevantAgencyRecord[] = [];
  try {
    if (!keyword) {
      throw new Error("No agency search keyword provided");
    }
    agencySearchResults = await searchAndFlattenAgencies(
      keyword,
      selectedStatuses,
    );
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
