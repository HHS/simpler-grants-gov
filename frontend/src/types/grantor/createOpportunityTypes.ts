export interface CreateOpportunityRecord {
  opportunity_id?: string;
  agency_id: string;
  opportunity_number: string;
  opportunity_title: string;
  category: string;
  category_explanation?: string;
  assistance_listing_number: string;
}

export type FieldValidationErrors = {
  agencyId?: string[];
  opportunityNumber?: string[];
  opportunityTitle?: string[];
  category?: string[];
  categoryExplanation?: string[];
  assistanceListingNumber?: string[];
};

export interface CreateOpportunityResponse {
  validationErrors?: FieldValidationErrors;
  errorMessage?: string;
  data?: CreateOpportunityRecord;
  success?: boolean;
}
