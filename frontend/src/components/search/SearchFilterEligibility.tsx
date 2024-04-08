"use client";

import {
  FilterOption,
  SearchFilterAccordion,
} from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";

export interface SearchFilterEligibilityProps {
  initialQueryParams: Set<string>;
  formRef: React.RefObject<HTMLFormElement>;
}

export default function SearchFilterEligibility({
  formRef,
  initialQueryParams,
}: SearchFilterEligibilityProps) {
  const initialFilterOptions: FilterOption[] = [
    {
      id: "eligibility-state_governments",
      label: "State Governments",
      value: "state_governments",
    },
    {
      id: "eligibility-county_governments",
      label: "County Governments",
      value: "county_governments",
    },
    {
      id: "eligibility-city_or_township_governments",
      label: "City or Township Governments",
      value: "city_or_township_governments",
    },
    {
      id: "eligibility-special_district_governments",
      label: "Special District Governments",
      value: "special_district_governments",
    },
    {
      id: "eligibility-independent_school_districts",
      label: "Independent School Districts",
      value: "independent_school_districts",
    },
    {
      id: "eligibility-public_and_state_institutions_of_higher_education",
      label: "Public and State Institutions of Higher Education",
      value: "public_and_state_institutions_of_higher_education",
    },
    {
      id: "eligibility-private_institutions_of_higher_education",
      label: "Private Institutions of Higher Education",
      value: "private_institutions_of_higher_education",
    },
    {
      id: "eligibility-federally_recognized_native_american_tribal_governments",
      label: "Federally Recognized Native American Tribal Governments",
      value: "federally_recognized_native_american_tribal_governments",
    },
    {
      id: "eligibility-other_native_american_tribal_organizations",
      label: "Other Native American Tribal Organizations",
      value: "other_native_american_tribal_organizations",
    },
    {
      id: "eligibility-public_and_indian_housing_authorities",
      label: "Public and Indian Housing Authorities",
      value: "public_and_indian_housing_authorities",
    },
    {
      id: "eligibility-nonprofits_non_higher_education_with_501c3",
      label: "Nonprofits Non Higher Education with 501c3",
      value: "nonprofits_non_higher_education_with_501c3",
    },
    {
      id: "eligibility-nonprofits_non_higher_education_without_501c3",
      label: "Nonprofits having a 501(c)(3) status with the IRS, other than institutions of higher education",
      value: "nonprofits_non_higher_education_without_501c3",
    },
    {
      id: "eligibility-individuals",
      label: "Individuals",
      value: "individuals",
    },
    {
      id: "eligibility-for_profit_organizations_other_than_small_businesses",
      label: "For-Profit Organizations Other Than Small Businesses",
      value: "for_profit_organizations_other_than_small_businesses",
    },
    {
      id: "eligibility-small_businesses",
      label: "Small Businesses",
      value: "small_businesses",
    },
    {
      id: "eligibility-other",
      label: "Other",
      value: "other",
    },
    {
      id: "eligibility-unrestricted",
      label: "Unrestricted",
      value: "unrestricted",
    },
  ];

  return (
    <SearchFilterAccordion
      initialFilterOptions={initialFilterOptions}
      title="Eligibility"
      queryParamKey="eligibility"
      formRef={formRef}
      initialQueryParams={initialQueryParams}
    />
  );
}
