import "server-only";

import { OpportunityApiResponse } from "src/types/opportunity/opportunityResponseTypes";

import BaseApi from "./BaseApi";

export default class OpportunityListingAPI extends BaseApi {
  get namespace(): string {
    return "opportunities";
  }

  async getOpportunityById(
    opportunityId: number,
  ): Promise<OpportunityApiResponse> {
    const subPath = `${opportunityId}`;
    const response = await this.request<OpportunityApiResponse>(
      "GET",
      // this.basePath,
      // this.namespace,
      subPath,
    );
    return response;
  }
}
