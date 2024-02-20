import BaseApi, { JSONRequestBody } from "./BaseApi"; // Adjust the import path as needed

export interface SearchResponseData {
  opportunities: unknown[];
}

export default class SearchOpportunityAPI extends BaseApi {
  get basePath(): string {
    return "search/opportunities";
  }

  get namespace(): string {
    return "searchOpportunities";
  }

  get headers() {
    return {};
  }

  async getSearchOpportunities(queryParams?: JSONRequestBody) {
    const subPath = "";

    const response = await this.request<SearchResponseData>(
      "GET",
      subPath,
      queryParams
    );

    return response;
  }
}
