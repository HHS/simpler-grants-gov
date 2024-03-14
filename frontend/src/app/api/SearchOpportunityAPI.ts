import "server-only";

import BaseApi from "./BaseApi";
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

  async searchOpportunities(page = 1) {
    const requestBody = {
      pagination: {
        order_by: "opportunity_id",
        page_offset: page,
        page_size: 25,
        sort_direction: "ascending",
      },
    };

    const subPath = "search";
    const response = await this.request(
      "POST",
      this.basePath,
      this.namespace,
      subPath,
      requestBody,
    );

    return response;
  }
}
