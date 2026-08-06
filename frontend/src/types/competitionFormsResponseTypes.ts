import { APIResponse } from "src/types/apiResponseTypes";

import { Competition } from "./competitionsResponseTypes";

export interface CompetitionFormsApiResponse extends APIResponse {
  data: Competition;
}
