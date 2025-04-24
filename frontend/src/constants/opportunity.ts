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
