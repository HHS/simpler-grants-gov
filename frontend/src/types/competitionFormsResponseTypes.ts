import { APIResponse } from "src/types/apiResponseTypes";

export interface CompetitionFormDetail {
  form_id: string;
  is_required: boolean;
}

export interface CompetitionFormsDetailApiResponse extends APIResponse {
  data: CompetitionFormDetail[];
}
