import { LabelValueOption } from "src/types/generalTypes";
import { FilterOption } from "src/types/search/searchFilterTypes";

export const eligibilityTypes = [
  {
    id: "eligibility-state_governments",
    label: "State governments",
    value: "state_governments",
    group: "government",
  },
  {
    id: "eligibility-county_governments",
    label: "County governments",
    value: "county_governments",
    group: "government",
  },
  {
    id: "eligibility-city_or_township_governments",
    label: "City or township governments",
    value: "city_or_township_governments",
    group: "government",
  },
  {
    id: "eligibility-special_district_governments",
    label: "Special district governments",
    value: "special_district_governments",
    group: "government",
  },
  {
    id: "eligibility-independent_school_districts",
    label: "Independent school districts",
    value: "independent_school_districts",
    group: "education",
  },
  {
    id: "eligibility-public_and_state_institutions_of_higher_education",
    label: "Public and state institutions of higher education",
    value: "public_and_state_institutions_of_higher_education",
    group: "education",
  },
  {
    id: "eligibility-private_institutions_of_higher_education",
    label: "Private institutions of higher education",
    value: "private_institutions_of_higher_education",
    group: "education",
  },
  {
    id: "eligibility-federally_recognized_native_american_tribal_governments",
    label: "Federally recognized Native American tribal governments",
    value: "federally_recognized_native_american_tribal_governments",
    group: "government",
  },
  {
    id: "eligibility-other_native_american_tribal_organizations",
    label: "Other Native American tribal organizations",
    value: "other_native_american_tribal_organizations",
    group: "nonprofit",
  },
  {
    id: "eligibility-public_and_indian_housing_authorities",
    label: "Public and Indian housing authorities",
    value: "public_and_indian_housing_authorities",
    group: "government",
  },
  {
    id: "eligibility-nonprofits_non_higher_education_with_501c3",
    label: "Nonprofits non-higher education with 501(c)(3)",
    value: "nonprofits_non_higher_education_with_501c3",
    group: "nonprofit",
  },
  {
    id: "eligibility-nonprofits_non_higher_education_without_501c3",
    label: "Nonprofits non-higher education without 501(c)(3)",
    value: "nonprofits_non_higher_education_without_501c3",
    group: "nonprofit",
  },
  {
    id: "eligibility-individuals",
    label: "Individuals",
    value: "individuals",
    group: "miscellaneous",
  },
  {
    id: "eligibility-for_profit_organizations_other_than_small_businesses",
    label: "For-profit organizations other than small businesses",
    value: "for_profit_organizations_other_than_small_businesses",
    group: "business",
  },
  {
    id: "eligibility-small_businesses",
    label: "Small businesses",
    value: "small_businesses",
    group: "business",
  },
  {
    id: "eligibility-other",
    label: "Other",
    value: "other",
    group: "miscellaneous",
  },
  {
    id: "eligibility-unrestricted",
    label: "Unrestricted",
    value: "unrestricted",
    group: "miscellaneous",
  },
];

export const OPPORTUNITY_CATEGORY_OPTIONS: LabelValueOption[] = [
  { label: "Discretionary", value: "discretionary" },
  { label: "Mandatory", value: "mandatory" },
  { label: "Continuation", value: "continuation" },
  { label: "Earmark", value: "earmark" },
  { label: "Other", value: "other" },
];

// these are used to more easily format a UI based on eligibility values

// represents a map of { value: group }
export const eligbilityValueToGroup = eligibilityTypes.reduce(
  (mapping, { group, value }) => {
    mapping[value] = group;
    return mapping;
  },
  {} as { [key: string]: string },
);

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
    label: "Procurement Contract",
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
  { id: "category-recovery_act", label: "Recovery Act", value: "recovery_act" },
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
    id: "category-recreation_and_tourism",
    label: "Recreation and Tourism",
    value: "recreation_and_tourism",
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

export const ELIGIBILITY_OPTIONS: LabelValueOption[] = eligibilityTypes;
