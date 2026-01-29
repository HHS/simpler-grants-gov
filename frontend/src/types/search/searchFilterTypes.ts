export const backendFilterNames = [
  "opportunity_status",
  "funding_instrument",
  "applicant_type",
  "agency",
  "assistance_listing_number",
  "funding_category",
  "close_date",
  "post_date",
  "is_cost_sharing",
] as const;

export const searchFilterNames = [
  "status",
  "fundingInstrument",
  "eligibility",
  "agency",
  "category",
  "closeDate",
  "postedDate",
  "costSharing",
  "topLevelAgency",
  "assistanceListingNumber",
] as const;

export type FrontendFilterNames = (typeof searchFilterNames)[number];
export type BackendFilterNames = (typeof backendFilterNames)[number];
export type HardcodedFrontendFilterNames = Exclude<
  FrontendFilterNames,
  "agency" | "topLevelAgency" | "assistanceListingNumber"
>;

export interface FilterOption {
  children?: FilterOption[];
  id: string;
  isChecked?: boolean;
  label: string;
  value: string;
  tooltip?: string;
}

export interface FilterOptionWithChildren extends FilterOption {
  children: FilterOption[];
}

export interface RelevantAgencyRecord {
  agency_code: string;
  agency_id: number;
  agency_name: string;
  top_level_agency: null | RelevantAgencyRecord;
}

export type FilterPillLabelData = {
  label: string;
  queryParamKey: FrontendFilterNames;
  queryParamValue: string;
};
