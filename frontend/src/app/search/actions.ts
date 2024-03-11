// All exports in this file are server actions
"use server";

import { getSearchFetcher } from "../../services/searchfetcher/SearchFetcherUtil";

const searchFetcher = getSearchFetcher();

export async function updateResults() {
  return await searchFetcher.fetchOpportunities();
}
