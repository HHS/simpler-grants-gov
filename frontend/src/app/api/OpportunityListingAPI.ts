// import "server-only";

// import { OpportunityApiResponse } from "src/types/opportunity/opportunityResponseTypes";

// import BaseApi from "./BaseApi";

// export default class OpportunityListingAPI extends BaseApi {
//   // constructor() {
//   //   console.log("*** init opporutnity api");
//   //   super();
//   // }

//   get namespace(): string {
//     return "opportunities";
//   }

//   async getOpportunityById(
//     opportunityId: number,
//   ): Promise<OpportunityApiResponse> {
//     // eslint-disable-next-line no-console
//     console.log("!!! opportunity request", opportunityId);
//     const response = await this.request<OpportunityApiResponse>(
//       "GET",
//       `${opportunityId}`,
//     );
//     return response;
//   }
// }
