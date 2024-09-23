import "server-only";

import SearchOpportunityAPI from "src/app/api/SearchOpportunityAPI";
import { SearchAPIResponse } from "src/types/search/searchResponseTypes";

import { QueryParamData, SearchFetcher } from "./SearchFetcher";

export class APISearchFetcher extends SearchFetcher {
  private searchApi: SearchOpportunityAPI;

  constructor() {
    super();
    this.searchApi = new SearchOpportunityAPI();
  }

  async fetchOpportunities(
    searchInputs: QueryParamData,
  ): Promise<SearchAPIResponse> {
    try {
      // Keep commented in case we need to simulate a delay to test loaders
      // await new Promise((resolve) => setTimeout(resolve, 13250));

      const response: SearchAPIResponse =
        (await this.searchApi.searchOpportunities(
          searchInputs,
        )) as SearchAPIResponse;
      response.actionType = searchInputs.actionType;
      response.fieldChanged = searchInputs.fieldChanged;

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
