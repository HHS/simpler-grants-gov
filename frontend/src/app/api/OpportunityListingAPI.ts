import "server-only";

import { environment } from "src/constants/environments";
import { OpportunityApiResponse } from "src/types/opportunity/opportunityResponseTypes";

import BaseApi from "./BaseApi";

export default class OpportunityListingAPI extends BaseApi {
  get version(): string {
    return "v1";
  }

  get basePath(): string {
    return environment.API_URL;
  }

  get namespace(): string {
    return "opportunities";
  }

  async getOpportunityById(
    opportunityId: number,
  ): Promise<OpportunityApiResponse> {
    await new Promise((resolve) => setTimeout(resolve, 3000));
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
