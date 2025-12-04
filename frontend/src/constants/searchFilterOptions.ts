import { omit } from "lodash";
import { eligibilityTypes } from "src/constants/opportunity";
import { FilterOption } from "src/types/search/searchFilterTypes";

// Note that these labels are not translated currently
// To translate them we would want to list the translation key in the label
// And have the translation system consume that key wherever the value is needed

export const eligibilityOptions: FilterOption[] = eligibilityTypes.map((type) =>
  omit(type, "group"),
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

export const fundingOptions: FilterOption[] = [
  {
    id: "funding-instrument-cooperative_agreement",
    label: "Cooperative Agreement",
    value: "cooperative_agreement",
    tooltip:
      "Involves active agency participation in a project, while grants provide funds and oversight without direct involvement.",
  },
  {
    id: "funding-instrument-grant",
    label: "Grant",
    value: "grant",
  },
  {
    id: "funding-instrument-procurement_contract",
    label: "Procurement Contract ",
    value: "procurement_contract",
    tooltip:
      "Allows the government to purchase goods and services for its benefit, while grants provide financial support to advance a public purpose.",
  },
  {
    id: "funding-instrument-other",
    label: "Other",
    value: "other",
  },
];

export const categoryOptions: FilterOption[] = [
  {
    id: "category-recovery_act",
    label: "Recovery Act",
    value: "recovery_act",
  },
  { id: "category-agriculture", label: "Agriculture", value: "agriculture" },
  { id: "category-arts", label: "Arts", value: "arts" },
  {
    id: "category-business_and_commerce",
    label: "Business and Commerce",
    value: "business_and_commerce",
  },
  {
    id: "category-community_development",
    label: "Community Development",
    value: "community_development",
  },
  {
    id: "category-consumer_protection",
    label: "Consumer Protection",
    value: "consumer_protection",
  },
  {
    id: "category-disaster_prevention_and_relief",
    label: "Disaster Prevention and Relief",
    value: "disaster_prevention_and_relief",
  },
  { id: "category-education", label: "Education", value: "education" },
  {
    id: "category-employment_labor_and_training",
    label: "Employment, Labor, and Training",
    value: "employment_labor_and_training",
  },
  { id: "category-energy", label: "Energy", value: "energy" },
  {
    id: "category-energy_infrastructure_and_critical_mineral_and_materials",
    label: "Energy Infrastructure and Critical Mineral and Materials (EICMM)",
    value: "energy_infrastructure_and_critical_mineral_and_materials",
  },
  { id: "category-environment", label: "Environment", value: "environment" },
  {
    id: "category-food_and_nutrition",
    label: "Food and Nutrition",
    value: "food_and_nutrition",
  },
  { id: "category-health", label: "Health", value: "health" },
  { id: "category-housing", label: "Housing", value: "housing" },
  { id: "category-humanities", label: "Humanities", value: "humanities" },
  {
    id: "category-information_and_statistics",
    label: "Information and Statistics",
    value: "information_and_statistics",
  },
  {
    id: "category-infrastructure_investment_and_jobs_act",
    label: "Infrastructure Investment and Jobs Act",
    value: "infrastructure_investment_and_jobs_act",
  },
  {
    id: "category-income_security_and_social_services",
    label: "Income Security and Social Services",
    value: "income_security_and_social_services",
  },
  {
    id: "category-law_justice_and_legal_services",
    label: "Law, Justice, and Legal Services",
    value: "law_justice_and_legal_services",
  },
  {
    id: "category-natural_resources",
    label: "Natural Resources",
    value: "natural_resources",
  },
  {
    id: "category-opportunity_zone_benefits",
    label: "Opportunity Zone Benefits",
    value: "opportunity_zone_benefits",
  },
  {
    id: "category-regional_development",
    label: "Regional Development",
    value: "regional_development",
  },
  {
    id: "category-science_technology_and_other_research_and_development",
    label: "Science, Technology, and Other Research and Development",
    value: "science_technology_and_other_research_and_development",
  },
  {
    id: "category-transportation",
    label: "Transportation",
    value: "transportation",
  },
  {
    id: "category-affordable_care_act",
    label: "Affordable Care Act",
    value: "affordable_care_act",
  },
  { id: "category-other", label: "Other", value: "other" },
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
  category: categoryOptions,
  fundingInstrument: fundingOptions,
};

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
