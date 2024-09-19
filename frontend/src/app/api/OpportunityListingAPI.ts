import "server-only";

import { OpportunityApiResponse } from "src/types/opportunity/opportunityResponseTypes";

import BaseApi from "./BaseApi";

export default class OpportunityListingAPI extends BaseApi {
  get version(): string {
    return "v1";
  }

  get basePath(): string {
    return process.env.API_URL || "";
  }

  get namespace(): string {
    return "opportunities";
  }

  async getOpportunityById(
    opportunityId: number,
  ): Promise<OpportunityApiResponse> {
    const subPath = `${opportunityId}`;
    const response = (await this.request(
      "GET",
      this.basePath,
      this.namespace,
      subPath,
    )) as OpportunityApiResponse;
    return response;
  }
}
