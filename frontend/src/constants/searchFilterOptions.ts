import {
  categoryOptions,
  eligibilityTypes,
  fundingOptions,
} from "src/constants/opportunity";
import { FilterOption } from "src/types/search/searchFilterTypes";

// Note that these labels are not translated currently
// To translate them we would want to list the translation key in the label
// And have the translation system consume that key wherever the value is needed

export const eligibilityOptions: FilterOption[] = eligibilityTypes.map(
  (type) => {
    const { group: _group, ...withoutGroup } = type;
    return withoutGroup;
  },
);

export const statusOptions: FilterOption[] = [
  {
    id: "status-forecasted",
    label: "Forecasted",
    value: "forecasted",
  },
  {
    id: "status-open",
    label: "Open",
    value: "posted",
  },
  {
    id: "status-closed",
    label: "Closed",
    value: "closed",
  },
  {
    id: "status-archived",
    label: "Archived",
    value: "archived",
  },
];

export const closeDateOptions: FilterOption[] = [
  {
    id: "close-date-7",
    label: "Next 7 days",
    value: "7",
  },
  {
    id: "close-date-30",
    label: "Next 30 days",
    value: "30",
  },
  {
    id: "close-date-90",
    label: "Next 90 days",
    value: "90",
  },
  {
    id: "close-date-120",
    label: "Next 120 days",
    value: "120",
  },
];

export const postedDateOptions: FilterOption[] = [
  {
    id: "posted-date-3",
    label: "Within the last 3 days",
    value: "3",
  },
  {
    id: "posted-date-7",
    label: "Within the last 7 days",
    value: "7",
  },
  {
    id: "posted-date-14",
    label: "Within the last 14 days",
    value: "14",
  },
  {
    id: "posted-date-30",
    label: "Within the last 30 days",
    value: "30",
  },
  {
    id: "posted-date-60",
    label: "Within the last 60 days",
    value: "60",
  },
];

export const costSharingOptions: FilterOption[] = [
  {
    id: "cost-sharing-yes",
    label: "Yes",
    value: "true",
  },
  {
    id: "cost-sharing-no",
    label: "No",
    value: "false",
  },
];
export const andOrOptions = [
  {
    id: "andOr-and",
    label: "Must include all words (ex. transportation AND safety)",
    value: "AND",
  },
  {
    id: "andOr-or",
    label: "May include any words (ex. transportation OR safety)",
    value: "OR",
  },
];

export const allFilterOptions = {
  status: statusOptions,
  eligibility: eligibilityOptions,
  costSharing: costSharingOptions,
  closeDate: closeDateOptions,
  postedDate: postedDateOptions,
  category: categoryOptions,
  fundingInstrument: fundingOptions,
};

export const savedOpportunityStatusOptions: FilterOption[] = [
  {
    id: "saved-status-any",
    label: "Any opportunity status",
    value: "",
  },
  ...statusOptions.map((option) => ({
    ...option,
    id: `saved-${option.id}`,
  })),
];

export const sortOptions: FilterOption[] = [
  {
    label: "Most relevant (Default)",
    value: "relevancy",
    id: "relevancy",
  },
  {
    label: "Close date (Furthest)",
    value: "closeDateDesc",
    id: "closeDateDesc",
  },
  { label: "Close date (Soonest)", value: "closeDateAsc", id: "closeDateAsc" },
  {
    label: "Posted date (Newest)",
    value: "postedDateDesc",
    id: "postedDateDesc",
  },
  {
    label: "Posted date (Oldest)",
    value: "postedDateAsc",
    id: "postedDateAsc",
  },
  {
    label: "Opportunity title (A to Z)",
    value: "opportunityTitleAsc",
    id: "opportunityTitleAsc",
  },
  {
    label: "Opportunity title (Z to A)",
    value: "opportunityTitleDesc",
    id: "opportunityTitleDesc",
  },
  {
    label: "Award minimum (Lowest)",
    value: "awardFloorAsc",
    id: "awardFloorAsc",
  },
  {
    label: "Award minimum (Highest)",
    value: "awardFloorDesc",
    id: "awardFloorDesc",
  },
  {
    label: "Award maximum (Lowest)",
    value: "awardCeilingAsc",
    id: "awardCeilingAsc",
  },
  {
    label: "Award maximum (Highest)",
    value: "awardCeilingDesc",
    id: "awardCeilingDesc",
  },
];
