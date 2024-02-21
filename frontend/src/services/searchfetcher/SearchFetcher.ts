import { Opportunity } from "../../types/searchTypes";

export abstract class SearchFetcher {
  abstract fetchOpportunities(): Promise<Opportunity[]>;
}

export async function fetchSearchOpportunities(
  searchFetcher: SearchFetcher
): Promise<Opportunity[]> {
  try {
    return await searchFetcher.fetchOpportunities();
  } catch (error) {
    console.error("Failed to fetch opportunities:", error);
    return [];
  }
}
