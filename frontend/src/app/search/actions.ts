// All exports in this file are server actions
"use server";

import { APISearchFetcher } from "../../services/searchfetcher/APISearchFetcher";
import { MockSearchFetcher } from "../../services/searchfetcher/MockSearchFetcher";
import { fetchSearchOpportunities } from "../../services/searchfetcher/SearchFetcher";

const useMockData = false;
const searchFetcher = useMockData
  ? new MockSearchFetcher()
  : new APISearchFetcher();

export async function updateResults(prevState, formData) {
  console.log("action => ", formData);
  return await fetchSearchOpportunities(searchFetcher);
}
