export interface CreateOpportunityRecord {
  agency_id: string;
  opportunity_number: string;
  opportunity_title: string;
  category: string;
  category_explanation?: string;
}

export type fieldValidationErrors = {
  agencyId?: string[];
  opportunityNumber?: string[];
  opportunityTitle?: string[];
  category?: string[];
  categoryExplanation?: string[];
};

export interface CreateOpportunityResponse {
  validationErrors?: fieldValidationErrors;
  data?: CreateOpportunityRecord;
  showExplain?: boolean;
  showSave?: boolean;
  errorMessage?: string;
  success?: boolean;
}
