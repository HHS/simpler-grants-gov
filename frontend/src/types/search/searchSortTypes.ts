export type SortOptions =
  | "relevancy"
  | "postedDateDesc"
  | "postedDateAsc"
  | "closeDateDesc"
  | "closeDateAsc"
  | "opportunityTitleAsc"
  | "opportunityTitleDesc"
  | "awardFloorAsc"
  | "awardFloorDesc"
  | "awardCeilingAsc"
  | "awardCeilingDesc";

export type SortOption = {
  label: string;
  value: SortOptions;
};
