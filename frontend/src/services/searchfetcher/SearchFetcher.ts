import { SearchResponseData } from "../../api/SearchOpportunityAPI";

export abstract class SearchFetcher {
  abstract fetchOpportunities(): Promise<SearchResponseData>;
}

export async function fetchSearchOpportunities(
  searchFetcher: SearchFetcher,
): Promise<SearchResponseData> {
  try {
    return await searchFetcher.fetchOpportunities();
  } catch (error) {
    console.error("Failed to fetch opportunities:", error);
    return []
  }
}
