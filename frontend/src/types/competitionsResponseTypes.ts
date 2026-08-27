import { APIResponse } from "./apiResponseTypes";
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
export type CompetitionForms = { form: FormDetail; is_required: boolean }[];

export type CompetitionFormsSubmitApi = {
  form_id: string;
  is_required: boolean;
}[];

export type ApplicantTypes = "individual" | "organization";

// This is used for create and update
export type CompetitionSaveRequest = {
  competition_title: string | null;
  opening_date: string | null;
  closing_date: string | null;
  contact_info: string | null;
  open_to_applicants: ApplicantTypes[];
};

export interface CompetitionSaveApiResponse extends APIResponse {
  data: Competition;
}

export type Competition = {
  closing_date: string;
  competition_forms: CompetitionForms;
  competition_id: string;
  competition_info: string;
  competition_instructions: CompetitionInstructions[];
  competition_title: string;
  contact_info: string | null;
  expected_application_count: number | null;
  grace_period: number | null;
  is_open: boolean;
  open_to_applicants: ApplicantTypes[];
  opening_date: string;
  opportunity_assistance_listings: OpportunityAssistanceListing[];
  opportunity_id: number;
  opportunity: BaseOpportunity;
  public_competition_id?: string | null;
};

export interface CompetitionInstructionsApiResponse extends APIResponse {
  data: {
    competition_instruction_id: string;
    file_name: string;
    created_at: string;
  };
}
