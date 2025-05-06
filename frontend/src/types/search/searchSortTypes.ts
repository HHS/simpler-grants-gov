export type SortOptions =
  | "relevancy"
  | "postedDateDesc"
  | "postedDateAsc"
  | "closeDateDesc"
  | "closeDateAsc"
  | "opportunityTitleAsc"
  | "opportunityTitleDesc"
  | "agencyAsc"
  | "agencyDesc"
  | "opportunityNumberDesc"
  | "opportunityNumberAsc";

export type SortOption = {
  label: string;
  value: SortOptions;
};
