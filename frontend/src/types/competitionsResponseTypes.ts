import { APIResponse } from "src/types/apiResponseTypes";
import { FormDetail } from "./formResponseTypes";

export interface CompetitionsDetailApiResponse extends APIResponse {
  data: {
    competition_forms: [{ form: FormDetail }];
    competition_id: string;
    opportunity_id: number;
  };
}
