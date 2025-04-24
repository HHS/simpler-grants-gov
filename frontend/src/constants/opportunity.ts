export const eligibilityTypes = [
  {
    id: "eligibility-state_governments",
    label: "State Governments",
    value: "state_governments",
    group: "government",
  },
  {
    id: "eligibility-county_governments",
    label: "County Governments",
    value: "county_governments",
    group: "government",
  },
  {
    id: "eligibility-city_or_township_governments",
    label: "City or Township Governments",
    value: "city_or_township_governments",
    group: "government",
  },
  {
    id: "eligibility-special_district_governments",
    label: "Special District Governments",
    value: "special_district_governments",
    group: "government",
  },
  {
    id: "eligibility-independent_school_districts",
    label: "Independent School Districts",
    value: "independent_school_districts",
    group: "education",
  },
  {
    id: "eligibility-public_and_state_institutions_of_higher_education",
    label: "Public and State Institutions of Higher Education",
    value: "public_and_state_institutions_of_higher_education",
    group: "education",
  },
  {
    id: "eligibility-private_institutions_of_higher_education",
    label: "Private Institutions of Higher Education",
    value: "private_institutions_of_higher_education",
    group: "education",
  },
  {
    id: "eligibility-federally_recognized_native_american_tribal_governments",
    label: "Federally Recognized Native American Tribal Governments",
    value: "federally_recognized_native_american_tribal_governments",
    group: "government",
  },
  {
    id: "eligibility-other_native_american_tribal_organizations",
    label: "Other Native American Tribal Organizations",
    value: "other_native_american_tribal_organizations",
    group: "nonprofit",
  },
  {
    id: "eligibility-public_and_indian_housing_authorities",
    label: "Public and Indian Housing Authorities",
    value: "public_and_indian_housing_authorities",
    group: "government",
  },
  {
    id: "eligibility-nonprofits_non_higher_education_with_501c3",
    label:
      "Nonprofits without 501(c)(3), other than institutions of higher education",
    value: "nonprofits_non_higher_education_with_501c3",
    group: "nonprofit",
  },
  {
    id: "eligibility-nonprofits_non_higher_education_without_501c3",
    label:
      "Nonprofits with 501(c)(3), other than institutions of higher education",
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
    label: "For-Profit Organizations Other Than Small Businesses",
    value: "for_profit_organizations_other_than_small_businesses",
    group: "business",
  },
  {
    id: "eligibility-small_businesses",
    label: "Small Businesses",
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

// these are used to more easily format a UI based on eligibility values

// represents a map of { value: group }
export const eligbilityValueToGroup = eligibilityTypes.reduce(
  (mapping, { group, value }) => {
    mapping[value] = group;
    return mapping;
  },
  {} as { [key: string]: string },
);

// represents a map of { value: label }
export const eligibilityValueToLabel = eligibilityTypes.reduce(
  (mapping, { label, value }) => {
    mapping[value] = label;
    return mapping;
  },
  {} as { [key: string]: string },
);
