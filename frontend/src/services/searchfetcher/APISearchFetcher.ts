import SearchOpportunityAPI, {
  SearchResponseData,
} from "../../api/SearchOpportunityAPI";

import { SearchFetcher } from "./SearchFetcher";

export class APISearchFetcher extends SearchFetcher {
  private searchApi: SearchOpportunityAPI;

  constructor() {
    super();
    this.searchApi = new SearchOpportunityAPI();
  }

  async fetchOpportunities(): Promise<SearchResponseData> {
    try {
      const response = await this.searchApi.searchOpportunities();
      if (!response.data) {
        throw new Error(`No data returned from API`);
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      throw error;
    }
  }
}
