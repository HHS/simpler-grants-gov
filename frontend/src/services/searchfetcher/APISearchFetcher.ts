import "server-only";

import { SearchFetcher, SearchFetcherProps } from "./SearchFetcher";

import { SearchAPIResponse } from "../../types/searchTypes";
import SearchOpportunityAPI from "../../app/api/SearchOpportunityAPI";

export class APISearchFetcher extends SearchFetcher {
  private searchApi: SearchOpportunityAPI;

  constructor() {
    super();
    this.searchApi = new SearchOpportunityAPI();
  }

  async fetchOpportunities({
    page,
  }: SearchFetcherProps): Promise<SearchAPIResponse> {
    try {
      // Keep commented in case we need to simulate a delay to test loaders
      //  await new Promise((resolve) => setTimeout(resolve, 1250));

      const response = await this.searchApi.searchOpportunities(page);
      if (!response.data) {
        throw new Error(`No data returned from API`);
      }
      return response;
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      throw error;
    }
  }
}
