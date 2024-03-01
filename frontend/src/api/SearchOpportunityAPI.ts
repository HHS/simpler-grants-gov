import BaseApi, { JSONRequestBody } from "./BaseApi";

export interface SearchResponseData {
  opportunities: unknown[];
}

export default class SearchOpportunityAPI extends BaseApi {
  get basePath(): string {
    return process.env.NEXT_PUBLIC_API_URL || "";
  }

  get namespace(): string {
    return "opportunities";
  }

  get headers() {
    const baseHeaders = super.headers;
    const searchHeaders = {};
    return { ...baseHeaders, ...searchHeaders };
  }

  async searchOpportunities(queryParams?: JSONRequestBody) {
    const requestBody = {
      pagination: {
        order_by: "opportunity_id",
        page_offset: 1,
        page_size: 25,
        sort_direction: "ascending",
      },
      ...queryParams,
    };

    const subPath = "search";
    const response = await this.request<SearchResponseData>(
      "POST",
      this.basePath,
      this.namespace,
      subPath,
      requestBody,
    );

    return response;
  }
}
