import { FormDetail } from "./formResponseTypes";
import {
  BaseOpportunity,
  OpportunityAssistanceListing,
} from "./opportunity/opportunityResponseTypes";

export interface CompetitionInstructions {
  created_at: string;
  download_path: string;
  file_name: string;
  updated_at: string;
}
export type CompetitionForms = [{ form: FormDetail; is_required: boolean }];

export type ApplicantTypes = "individual" | "organization";

export type Competition = {
  closing_date: string;
  competition_forms: CompetitionForms;
  competition_id: string;
  competition_info: string;
  competition_instructions: CompetitionInstructions[];
  competition_title: string;
  contact_info: null;
  is_open: boolean;
  open_to_applicants: ApplicantTypes[];
  opening_date: string;
  opportunity_assistance_listings: OpportunityAssistanceListing[];
  opportunity_id: number;
  opportunity: BaseOpportunity;
};
