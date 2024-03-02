import { Opportunity } from "../../types/searchTypes";
import { SearchFetcher } from "./SearchFetcher";
import SearchOpportunityAPI from "../../api/SearchOpportunityAPI";

export class APISearchFetcher extends SearchFetcher {
  private searchApi: SearchOpportunityAPI;

  constructor() {
    super();
    this.searchApi = new SearchOpportunityAPI();
  }

  async fetchOpportunities(): Promise<Opportunity[]> {
    try {
      const response = await this.searchApi.searchOpportunities();
      if (!response.data) {
        throw new Error(`No data returned from API`);
      }
      return response.data.opportunities as Opportunity[];
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      throw error;
    }
  }
}
