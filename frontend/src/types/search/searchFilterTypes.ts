const backendFilterTypes = [
  "funding_instrument",
  "applicant_type",
  "agency",
  "funding_category",
  "opportunity_status",
] as const;

export type BackendFilterNames = keyof typeof backendFilterTypes;
