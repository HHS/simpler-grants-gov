import "server-only";

import BaseApi, { JSONRequestBody } from "./BaseApi";

import { Opportunity } from "../../types/searchTypes";

export type SearchResponseData = Opportunity[];

export default class SearchOpportunityAPI extends BaseApi {
  get basePath(): string {
    return process.env.API_URL || "";
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
