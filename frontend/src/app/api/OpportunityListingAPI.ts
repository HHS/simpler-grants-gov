import "server-only";

import { ApiResponse } from "../../types/opportunity/opportunityResponseTypes";
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

  async getOpportunityById(opportunityId: number): Promise<ApiResponse> {
    const subPath = `${opportunityId}`;
    const response = await this.request(
      "GET",
      this.basePath,
      this.namespace,
      subPath,
    );
    return response as ApiResponse;
  }
}
