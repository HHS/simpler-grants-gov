import { searchFilterNames } from "./searchFilterTypes";

export type QuerySetParam = string | string[] | undefined;

export interface FilterQueryParamData {
  status: Set<string>;
  fundingInstrument: Set<string>;
  eligibility: Set<string>;
  agency: Set<string>;
  category: Set<string>;
  closeDate: Set<string>;
  costSharing: Set<string>;
  topLevelAgency: Set<string>;
}

// this is used for UI display so order matters
export const validSearchQueryParamKeys = [
  "query",
  ...searchFilterNames,
  "page",
  "sortby",
] as const;

// Only a few defined keys possible
// URL example => ?query=abcd&status=closed,archived
export type ValidSearchQueryParam = (typeof validSearchQueryParamKeys)[number];

export type ValidSearchQueryParamData = {
  [k in ValidSearchQueryParam]?: string;
};

export type QueryContextParams = {
  queryTerm: string | null | undefined;
  updateQueryTerm: (term: string) => void;
  totalPages: string | null | undefined;
  updateTotalPages: (page: string) => void;
  totalResults: string;
  updateTotalResults: (total: string) => void;
  updateLocalAndOrParam: (value: string) => void;
  localAndOrParam: string;
};
