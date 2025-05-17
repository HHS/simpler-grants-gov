export const backendFilterNames = [
  "opportunity_status",
  "funding_instrument",
  "applicant_type",
  "agency",
  "funding_category",
] as const;

export const searchFilterNames = [
  "status",
  "fundingInstrument",
  "eligibility",
  "agency",
  "category",
] as const;

export type FrontendFilterNames = (typeof searchFilterNames)[number];
export type BackendFilterNames = (typeof backendFilterNames)[number];

export interface FilterOption {
  children?: FilterOption[];
  id: string;
  isChecked?: boolean;
  label: string;
  value: string;
}

export interface FilterOptionWithChildren extends FilterOption {
  children: FilterOption[];
}
