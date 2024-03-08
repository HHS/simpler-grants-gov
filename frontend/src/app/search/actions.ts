// All exports in this file are server actions
"use server";

import { APISearchFetcher } from "../../services/searchfetcher/APISearchFetcher";
import { MockSearchFetcher } from "../../services/searchfetcher/MockSearchFetcher";
import { fetchSearchOpportunities } from "../../services/searchfetcher/SearchFetcher";

const searchFetcher = process.env.NEXT_PUBLIC_USE_SEARCH_MOCK_DATA
  ? new MockSearchFetcher()
  : new APISearchFetcher();

export async function updateResults() {
  return await fetchSearchOpportunities(searchFetcher);
}
