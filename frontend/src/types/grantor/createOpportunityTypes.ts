export interface CreateOpportunityRecord {
  agency_id: string;
  opportunity_number: string;
  opportunity_title: string;
  category: string;
  category_explanation?: string;
}

export type FieldValidationErrors = {
  agencyId?: string[];
  opportunityNumber?: string[];
  opportunityTitle?: string[];
  category?: string[];
  categoryExplanation?: string[];
};

export interface CreateOpportunityResponse {
  validationErrors?: FieldValidationErrors;
  errorMessage?: string;
  data?: CreateOpportunityRecord;
  success?: boolean;
}
