import { Opportunity, SearchFetcher } from "./SearchFetcher";

const URL = "https://jsonplaceholder.typicode.com/posts";

// TODO: call BaseApi or extension to make the actual call
export class APISearchFetcher extends SearchFetcher {
  async fetchOpportunities(): Promise<Opportunity[]> {
    try {
      const response = await fetch(URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Opportunity[] = (await response.json()) as Opportunity[];
      return data;
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      throw error;
    }
  }
}
