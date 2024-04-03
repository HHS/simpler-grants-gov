"use client";

import {
  FilterOption,
  SearchFilterAccordion,
} from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";

export interface SearchFilterCategoryyProps {
  initialQueryParams: Set<string>;
  formRef: React.RefObject<HTMLFormElement>;
}

export default function SearchFilterCategory({
  formRef,
  initialQueryParams,
}: SearchFilterCategoryyProps) {
  const initialFilterOptions: FilterOption[] = [
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

  return (
    <SearchFilterAccordion
      initialFilterOptions={initialFilterOptions}
      title="Category"
      queryParamKey="category"
      formRef={formRef}
      initialQueryParams={initialQueryParams}
    />
  );
}
