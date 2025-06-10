import { APIResponse } from "src/types/apiResponseTypes";

import { FormDetail } from "./formResponseTypes";
import { OpportunityAssistanceListing } from "./opportunity/opportunityResponseTypes";

export type Competition = {
  closing_date: string;
  competition_forms: [{ form: FormDetail; is_required: boolean }];
  competition_id: string;
  competition_info: string;
  competition_title: string;
  contact_info: null;
  is_open: boolean;
  open_to_applicants: [string];
  opening_date: string;
  opportunity_assistance_listings: OpportunityAssistanceListing[];
  opportunity_id: number;
};

export interface CompetitionsDetailApiResponse extends APIResponse {
  data: {
    competition_forms: [{ form: FormDetail }];
    competition_id: string;
    opportunity_id: number;
  };
}
