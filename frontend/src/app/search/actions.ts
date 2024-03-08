// All exports in this file are server actions
"use server";

import { APISearchFetcher } from "../../services/searchfetcher/APISearchFetcher";
import { MockSearchFetcher } from "../../services/searchfetcher/MockSearchFetcher";
import { fetchSearchOpportunities } from "../../services/searchfetcher/SearchFetcher";

const useMockData = true;
const searchFetcher = useMockData
  ? new MockSearchFetcher()
  : new APISearchFetcher();

export async function updateResults() {
  return await fetchSearchOpportunities(searchFetcher);
}
