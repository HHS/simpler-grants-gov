import { searchFilterNames } from "./searchFilterTypes";

export type QuerySetParam = string | string[] | undefined;

export interface FilterQueryParamData {
  status: Set<string>;
  fundingInstrument: Set<string>;
  eligibility: Set<string>;
  agency: Set<string>;
  category: Set<string>;
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
