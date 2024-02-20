// TODO: change to the actual API response
export interface Opportunity {
  userId: number;
  id: number;
  title: string;
  body: string;
}

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
