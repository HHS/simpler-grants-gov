import { FilterOption } from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";

export const eligibilityOptions: FilterOption[] = [
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
    label:
      "Nonprofits without 501(c)(3), other than institutions of higher education",
    value: "nonprofits_non_higher_education_with_501c3",
  },
  {
    id: "eligibility-nonprofits_non_higher_education_without_501c3",
    label:
      "Nonprofits with 501(c)(3), other than institutions of higher education",
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

export const fundingOptions: FilterOption[] = [
  {
    id: "funding-instrument-cooperative_agreement",
    label: "Cooperative Agreement",
    value: "cooperative_agreement",
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

export const agencyOptions: FilterOption[] = [
  {
    id: "DHS",
    label: "Department of Homeland Security",
    value: "DHS",
    children: [
      {
        id: "DHS-DHS",
        label: "Department of Homeland Security - FEMA",
        value: "DHS-DHS",
      },
      {
        id: "DHS-DHS-R5",
        label: "Region 5",
        value: "DHS-DHS-R5",
      },
      {
        id: "DHS-DHS-R6",
        label: "Region 6",
        value: "DHS-DHS-R6",
      },
      {
        id: "DHS-DHS-R7",
        label: "Region 7",
        value: "DHS-DHS-R7",
      },
      {
        id: "DHS-DHS-R1",
        label: "Region 1",
        value: "DHS-DHS-R1",
      },
      {
        id: "DHS-DHS-R2",
        label: "Region 2",
        value: "DHS-DHS-R2",
      },
      {
        id: "DHS-DHS-R3",
        label: "Region 3",
        value: "DHS-DHS-R3",
      },
      {
        id: "DHS-DHS-R4",
        label: "Region 4",
        value: "DHS-DHS-R4",
      },
      {
        id: "DHS-DHS-R10",
        label: "Region 10",
        value: "DHS-DHS-R10",
      },
      {
        id: "DHS-DHS-R8",
        label: "Region 8",
        value: "DHS-DHS-R8",
      },
      {
        id: "DHS-DHS-R9",
        label: "Region 9",
        value: "DHS-DHS-R9",
      },
      {
        id: "DHS-OGT",
        label: "Preparedness - OG&T",
        value: "DHS-OGT",
      },
      {
        id: "DHS-OPO",
        label: "Office of Procurement Operations - Grants Division",
        value: "DHS-OPO",
      },
      {
        id: "DHS-TSA",
        label: "Transportation Security Administration",
        value: "DHS-TSA",
      },
      {
        id: "DHS-USCG",
        label: "United States Coast Guard ",
        value: "DHS-USCG",
      },
    ],
  },
  {
    id: "CPSC",
    label: "Consumer Product Safety Commission",
    value: "CPSC",
  },
  {
    id: "DC",
    label: "Denali Commission",
    value: "DC",
  },
  {
    id: "AC",
    label: "AmeriCorps",
    value: "AC",
  },
  {
    id: "DOC",
    label: "Department of Commerce",
    value: "DOC",
    children: [
      {
        id: "DOC-EDA",
        label: "Economic Development Administration",
        value: "DOC-EDA",
      },
      {
        id: "DOC-EDA-JIAC",
        label: "Jobs and Innovation Accelerator Challenge",
        value: "DOC-EDA-JIAC",
      },
      {
        id: "DOC-DOCNOAAERA",
        label: "DOC NOAA - ERA Production",
        value: "DOC-DOCNOAAERA",
      },
      {
        id: "DOC-NOAA",
        label: "National Oceanic and Atmospheric Administration",
        value: "DOC-NOAA",
      },
      {
        id: "DOC-NIST",
        label: "National Institute of Standards and Technology",
        value: "DOC-NIST",
      },
      {
        id: "DOC-NTIA",
        label: "National Telecommunications and Information Admini",
        value: "DOC-NTIA",
      },
    ],
  },
  {
    id: "DOD",
    label: "Department of Defense",
    value: "DOD",
    children: [
      {
        id: "DOD-ONR-SEA-CRANE",
        label: "NSWC - CRANE",
        value: "DOD-ONR-SEA-CRANE",
      },
      {
        id: "DOD-AFMC",
        label: "Air Force -- Materiel Command",
        value: "DOD-AFMC",
      },
      {
        id: "DOD-AFOSR",
        label: "Air Force Office of Scientific Research",
        value: "DOD-AFOSR",
      },
      {
        id: "DOD-AF347CS",
        label: "USAF 347 Contracting Squadron",
        value: "DOD-AF347CS",
      },
      {
        id: "DOD-AFRL",
        label: "Air Force -- Research Lab",
        value: "DOD-AFRL",
      },
      {
        id: "DOD-AMC",
        label: "Dept of the Army -- Materiel Command",
        value: "DOD-AMC",
      },
      {
        id: "DOD-AFRL-AFRLDET8",
        label: "AFRL Kirtland AFB",
        value: "DOD-AFRL-AFRLDET8",
      },
      {
        id: "DOD-AMC-ACCAPGE",
        label: "ACC-APG-Edgewood",
        value: "DOD-AMC-ACCAPGE",
      },
      {
        id: "DOD-AMC-ACCAPGD",
        label: "ACC-APG-Detrick",
        value: "DOD-AMC-ACCAPGD",
      },
      {
        id: "DOD-AMC-ACCAPGB",
        label: "ACC-APG-Belvoir",
        value: "DOD-AMC-ACCAPGB",
      },
      {
        id: "DOD-AFRL-RW",
        label: "Munitions Directorate",
        value: "DOD-AFRL-RW",
      },
      {
        id: "DOD-AMC-ACCAPGFH",
        label: "ACC-APG-Fort Huachuca",
        value: "DOD-AMC-ACCAPGFH",
      },
      {
        id: "DOD-AMC-ACCRI",
        label: "Army Contracting Command Rock Island",
        value: "DOD-AMC-ACCRI",
      },
      {
        id: "DOD-AMC-ACCBL",
        label: "Army Contracting Command - Benet Laboratories",
        value: "DOD-AMC-ACCBL",
      },
      {
        id: "DOD-AMC-ACCAPGADA",
        label: "ACC-APG-Aberdeen Division A",
        value: "DOD-AMC-ACCAPGADA",
      },
      {
        id: "DOD-AMC-ACCNJ",
        label: "Army Contracting Command - New Jersey",
        value: "DOD-AMC-ACCNJ",
      },
      {
        id: "DOD-AMC-ACCAPGN",
        label: "ACC APG - Natick",
        value: "DOD-AMC-ACCAPGN",
      },
      {
        id: "DOD-ASMDC",
        label: "Dept. of the Army -- Space & Missle Defense Comman",
        value: "DOD-ASMDC",
      },
      {
        id: "DOD-AMRAA",
        label: "Dept. of the Army -- USAMRAA",
        value: "DOD-AMRAA",
      },
      {
        id: "DOD-COE",
        label: "Dept. of the Army  --  Corps of Engineers",
        value: "DOD-COE",
      },
      {
        id: "DOD-COE-ERDC",
        label: "Engineer Research and Development Center",
        value: "DOD-COE-ERDC",
      },
      {
        id: "DOD-COE-AK",
        label: "Alaska District",
        value: "DOD-COE-AK",
      },
      {
        id: "DOD-COE-OM",
        label: "Omaha District",
        value: "DOD-COE-OM",
      },
      {
        id: "DOD-COE-KC",
        label: "Kansas City District",
        value: "DOD-COE-KC",
      },
      {
        id: "DOD-COE-FW",
        label: "Fort Worth District",
        value: "DOD-COE-FW",
      },
      {
        id: "DOD-COE-SEA",
        label: "Seattle District",
        value: "DOD-COE-SEA",
      },
      {
        id: "DOD-COE-PORT",
        label: "USACE Portland District",
        value: "DOD-COE-PORT",
      },
      {
        id: "DOD-BRO",
        label: "OUSD R-E  Basic Research Office",
        value: "DOD-BRO",
      },
      {
        id: "DOD-AMC-MICCFSH",
        label: "Mission and Install. Cmd. JBSA Ft. Sam Houston",
        value: "DOD-AMC-MICCFSH",
      },
      {
        id: "DOD-COE-SAV",
        label: "Savannah District",
        value: "DOD-COE-SAV",
      },
      {
        id: "DOD-COE-CEERDCERL",
        label: "CEERD-CERL",
        value: "DOD-COE-CEERDCERL",
      },
      {
        id: "DOD-DARPA-IPTO",
        label: "DARPA - Information Processing Technology Office",
        value: "DOD-DARPA-IPTO",
      },
      {
        id: "DOD-DARPA-MTO",
        label: "DARPA - Microsystems Technology Office ",
        value: "DOD-DARPA-MTO",
      },
      {
        id: "DOD-DARPA-MTO-BAA0925",
        label: "DARPA-MTO-BAA-09-25",
        value: "DOD-DARPA-MTO-BAA0925",
      },
      {
        id: "DOD-DARPA",
        label: "Defense Advanced Research Projects Agency",
        value: "DOD-DARPA",
      },
      {
        id: "DOD-DARPA-STO",
        label: "DARPA - Strategic Technology Office",
        value: "DOD-DARPA-STO",
      },
      {
        id: "DOD-ONR-SEA-NSWCIH",
        label: "NSWC Indian Head",
        value: "DOD-ONR-SEA-NSWCIH",
      },
      {
        id: "DOD-DARPA-DSO",
        label: "DARPA - Defense Sciences Office",
        value: "DOD-DARPA-DSO",
      },
      {
        id: "DOD-DARPA-BTO",
        label: "DARPA - Biological Technologies Office",
        value: "DOD-DARPA-BTO",
      },
      {
        id: "DOD-DARPA-TTO",
        label: "DARPA - Tactical Technology Office",
        value: "DOD-DARPA-TTO",
      },
      {
        id: "DOD-DARPA-TCTO",
        label: "DARPA - Transformational Convergence Technology",
        value: "DOD-DARPA-TCTO",
      },
      {
        id: "DOD-DARPA-I2O",
        label: "DARPA - Information Innovation Office",
        value: "DOD-DARPA-I2O",
      },
      {
        id: "DOD-COE-WW",
        label: "Walla Walla District",
        value: "DOD-COE-WW",
      },
      {
        id: "DOD-OEA",
        label: "Office of Local Defense Community Cooperation",
        value: "DOD-OEA",
      },
      {
        id: "DOD-NGIA",
        label: "National Geospatial-Intelligence Agency ",
        value: "DOD-NGIA",
      },
      {
        id: "DOD-DTRA",
        label: "Defense Threat Reduction Agency",
        value: "DOD-DTRA",
      },
      {
        id: "DOD-ONR",
        label: "Office of Naval Research",
        value: "DOD-ONR",
      },
      {
        id: "DOD-DLA",
        label: "Defense Logistics Agency",
        value: "DOD-DLA",
      },
      {
        id: "DOD-ONR-FAC-N40080",
        label: "NAVFAC Washington DC ",
        value: "DOD-ONR-FAC-N40080",
      },
      {
        id: "DOD-ONR-FAC",
        label: "NAVAL FACILITIES ENGINEERING COMMAND",
        value: "DOD-ONR-FAC",
      },
      {
        id: "DOD-ONR-AIR",
        label: "NAVAIR",
        value: "DOD-ONR-AIR",
      },
      {
        id: "DOD-DIA",
        label: "Defense Intelligence Agency",
        value: "DOD-DIA",
      },
      {
        id: "DOD-DODEA",
        label: "DoD Education Activity",
        value: "DOD-DODEA",
      },
      {
        id: "DOD-ONR-AIR-NAWCADLAKE",
        label: "Naval Air Warfare Center Aircraft Div. Lakehurst",
        value: "DOD-ONR-AIR-NAWCADLAKE",
      },
      {
        id: "DOD-DHA",
        label: "Defense Health Agency",
        value: "DOD-DHA",
      },
      {
        id: "DOD-MDA",
        label: "Missile Defense Agency",
        value: "DOD-MDA",
      },
      {
        id: "DOD-ONR-NRL",
        label: "Naval Research Laboratory",
        value: "DOD-ONR-NRL",
      },
      {
        id: "DOD-ONR-SEA-N00178",
        label: "NSWC Dahlgren",
        value: "DOD-ONR-SEA-N00178",
      },
      {
        id: "DOD-ONR-SUP",
        label: "Naval Supply Systems Command",
        value: "DOD-ONR-SUP",
      },
      {
        id: "DOD-ONR-SPAWAR",
        label: "SPAWAR SYSTEMS CENTER",
        value: "DOD-ONR-SPAWAR",
      },
      {
        id: "DOD-ONR-FAC-N62473",
        label: "Naval Facilities Engineering Command Southwest",
        value: "DOD-ONR-FAC-N62473",
      },
      {
        id: "DOD-ONR-MED",
        label: "NAVAL MEDICAL LOGISTICS COMMAND",
        value: "DOD-ONR-MED",
      },
      {
        id: "DOD-ONR-SEA-N00253",
        label: "NUWC Division Keyport",
        value: "DOD-ONR-SEA-N00253",
      },
      {
        id: "DOD-ONR-SEA-NSWFCRD",
        label: "Naval Surface Warfare Center - Carderock",
        value: "DOD-ONR-SEA-NSWFCRD",
      },
      {
        id: "DOD-ONR-NIWCPAC",
        label: "Naval Information Warfare Center Pacific",
        value: "DOD-ONR-NIWCPAC",
      },
      {
        id: "DOD-ONR-FAC-NAVFACATL",
        label: "NAVFAC Atlantic",
        value: "DOD-ONR-FAC-NAVFACATL",
      },
      {
        id: "DOD-USAFA",
        label: "Air Force Academy",
        value: "DOD-USAFA",
      },
      {
        id: "DOD-USMC",
        label: "United States Marine Corps",
        value: "DOD-USMC",
      },
      {
        id: "DOD-USUHS-ERA",
        label: "USUHS Medical Research Projects",
        value: "DOD-USUHS-ERA",
      },
      {
        id: "DOD-USUHS",
        label: "Uniformed Services Univ. of the Health Sciences",
        value: "DOD-USUHS",
      },
      {
        id: "DOD-USUHS-ACQ",
        label: "USUHS Medical - Non- Research Projects",
        value: "DOD-USUHS-ACQ",
      },
      {
        id: "DOD-WHS",
        label: "Washington Headquarters Services",
        value: "DOD-WHS",
      },
    ],
  },
  {
    id: "DOE",
    label: "Department of Energy",
    value: "DOE",
    children: [
      {
        id: "DOE-GFO",
        label: "Golden Field Office",
        value: "DOE-GFO",
      },
      {
        id: "DOE-NETL",
        label: "National Energy Technology Laboratory",
        value: "DOE-NETL",
      },
      {
        id: "DOE-ID",
        label: "Idaho Field Office",
        value: "DOE-ID",
      },
      {
        id: "DOE-CH",
        label: "Chicago Service Center",
        value: "DOE-CH",
      },
      {
        id: "DOE-01",
        label: "Headquarters",
        value: "DOE-01",
      },
      {
        id: "DOE-NNSA",
        label: "NNSA",
        value: "DOE-NNSA",
      },
      {
        id: "DOE-EMCBC",
        label: "Environmental Management Consolidated Business Cen",
        value: "DOE-EMCBC",
      },
      {
        id: "DOE-ARPAE",
        label: "Advanced Research Projects Agency Energy ",
        value: "DOE-ARPAE",
      },
      {
        id: "DOE-RL",
        label: "Richland",
        value: "DOE-RL",
      },
      {
        id: "DOE-OR",
        label: "Oak Ridge Office",
        value: "DOE-OR",
      },
    ],
  },
  {
    id: "DOI",
    label: "Department of the Interior",
    value: "DOI",
    children: [
      {
        id: "DOI-FWS-MB",
        label: "Migratory Birds",
        value: "DOI-FWS-MB",
      },
      {
        id: "DOI-BOR",
        label: "Bureau of Reclamation",
        value: "DOI-BOR",
      },
      {
        id: "DOI-BLM",
        label: "Bureau of Land Management",
        value: "DOI-BLM",
      },
      {
        id: "DOI-BOR-D7800",
        label: "Bureau of Reclamation, Denver Office",
        value: "DOI-BOR-D7800",
      },
      {
        id: "DOI-BOR-MP3800",
        label: "Bureau of Reclamation, Mid-Pacific Regional Office",
        value: "DOI-BOR-MP3800",
      },
      {
        id: "DOI-FWS-REG2",
        label: "Region 2",
        value: "DOI-FWS-REG2",
      },
      {
        id: "DOI-BOR-PN",
        label: "Bureau of Reclamation - Pacific Northwest Region",
        value: "DOI-BOR-PN",
      },
      {
        id: "DOI-BOR-DO",
        label: "Bureau of Reclamation - Denver Office",
        value: "DOI-BOR-DO",
      },
      {
        id: "DOI-BOR-LC",
        label: "Bureau of Reclamation - Lower Colorado Region",
        value: "DOI-BOR-LC",
      },
      {
        id: "DOI-BOR-GP",
        label: "Bureau of Reclamation - Great Plains Region",
        value: "DOI-BOR-GP",
      },
      {
        id: "DOI-BIA",
        label: "Bureau of Indian Affairs",
        value: "DOI-BIA",
      },
      {
        id: "DOI-BOR-MP",
        label: "Bureau of Reclamation - Mid-Pacific Region",
        value: "DOI-BOR-MP",
      },
      {
        id: "DOI-BOEM",
        label: "Bureau of Ocean Energy Management",
        value: "DOI-BOEM",
      },
      {
        id: "DOI-FWS",
        label: "Fish and Wildlife Service",
        value: "DOI-FWS",
      },
      {
        id: "DOI-FWS-REG3",
        label: "Region 3",
        value: "DOI-FWS-REG3",
      },
      {
        id: "DOI-FWS-DCFM",
        label: "Div of Contracting & Facilities Mgt",
        value: "DOI-FWS-DCFM",
      },
      {
        id: "DOI-FWS-ES",
        label: "Endangered Species",
        value: "DOI-FWS-ES",
      },
      {
        id: "DOI-FWS-FHC",
        label: "Fisheries & Habitat Conservation",
        value: "DOI-FWS-FHC",
      },
      {
        id: "DOI-BOR-UCA1730",
        label: "Bureau of Reclamation-Upper Columbia Area Office",
        value: "DOI-BOR-UCA1730",
      },
      {
        id: "DOI-FWS-REG4",
        label: "Region 4",
        value: "DOI-FWS-REG4",
      },
      {
        id: "DOI-BOR-UC",
        label: "Bureau of Reclamation - Upper Colorado Region",
        value: "DOI-BOR-UC",
      },
      {
        id: "DOI-BSEE",
        label: "Bureau of Safety and Environmental Enforcement",
        value: "DOI-BSEE",
      },
      {
        id: "DOI-NBC1",
        label: "National Business Center",
        value: "DOI-NBC1",
      },
      {
        id: "DOI-NPS",
        label: "National Park Service",
        value: "DOI-NPS",
      },
      {
        id: "DOI-MMS",
        label: "Bureau of Ocean Energy Management ",
        value: "DOI-MMS",
      },
      {
        id: "DOI-FWS-REG7",
        label: "Region 7",
        value: "DOI-FWS-REG7",
      },
      {
        id: "DOI-FWS-REG",
        label: "Region 5",
        value: "DOI-FWS-REG",
      },
      {
        id: "DOI-IBC",
        label: "Interior Business Ceter",
        value: "DOI-IBC",
      },
      {
        id: "DOI-OSM",
        label: "Office of Surface Mining",
        value: "DOI-OSM",
      },
      {
        id: "DOI-USGS1",
        label: "Geological Survey",
        value: "DOI-USGS1",
      },
    ],
  },
  {
    id: "DOL",
    label: "Department of Labor",
    value: "DOL",
    children: [
      {
        id: "DOL-ETA",
        label: "Employment and Training Administration",
        value: "DOL-ETA",
      },
      {
        id: "DOL-ETA-ODEP",
        label: "Office of Disability Employment Policy",
        value: "DOL-ETA-ODEP",
      },
      {
        id: "DOL-ETA-ILAB",
        label: "Bureau of International Labor Affairs",
        value: "DOL-ETA-ILAB",
      },
      {
        id: "DOL-ETA-VETS",
        label: "Veterans Employment and Training Service",
        value: "DOL-ETA-VETS",
      },
      {
        id: "DOL-ETA-WB",
        label: "Womens Bureau",
        value: "DOL-ETA-WB",
      },
      {
        id: "DOL-OASAM",
        label: "OASAM",
        value: "DOL-OASAM",
      },
      {
        id: "DOL-MSHA",
        label: "Mine Safety and Health Administration",
        value: "DOL-MSHA",
      },
      {
        id: "DOL-OSHA",
        label: "Occupational Safety and Health Administration",
        value: "DOL-OSHA",
      },
      {
        id: "DOL-WB",
        label: "Womens Bureau",
        value: "DOL-WB",
      },
      {
        id: "DOL-ODEP",
        label: "Office of Disability Employment Policy",
        value: "DOL-ODEP",
      },
      {
        id: "DOL-VETS",
        label: "Veterans Employment and Training Service",
        value: "DOL-VETS",
      },
      {
        id: "DOL-ILAB",
        label: "Bureau of International Labor Affairs",
        value: "DOL-ILAB",
      },
    ],
  },
  {
    id: "DOS",
    label: "Department of State",
    value: "DOS",
    children: [
      {
        id: "DOS-AQM",
        label: "Office of Acquisitions Management",
        value: "DOS-AQM",
      },
      {
        id: "DOS-AF",
        label: "Bureau of African Affairs",
        value: "DOS-AF",
      },
      {
        id: "DOS-AFG",
        label: "U.S. Mission to Afghanistan",
        value: "DOS-AFG",
      },
      {
        id: "DOS-ARG",
        label: "U.S. Mission to Argentina",
        value: "DOS-ARG",
      },
      {
        id: "DOS-AGO",
        label: "U.S. Mission to Angola",
        value: "DOS-AGO",
      },
      {
        id: "DOS-ALB",
        label: "U.S. Mission to Albania",
        value: "DOS-ALB",
      },
      {
        id: "DOS-ARM",
        label: "U.S. Mission to Armenia",
        value: "DOS-ARM",
      },
      {
        id: "DOS-ARE",
        label: "U.S. Mission to United Arab Emirates",
        value: "DOS-ARE",
      },
      {
        id: "DOS-BLZ",
        label: "U.S. Mission to Belize",
        value: "DOS-BLZ",
      },
      {
        id: "DOS-BOL",
        label: "U.S. Mission to Bolivia ",
        value: "DOS-BOL",
      },
      {
        id: "DOS-BIH",
        label: "U.S. Mission to Bosnia and Herzegovina",
        value: "DOS-BIH",
      },
      {
        id: "DOS-AUT",
        label: "U.S. Mission to Austria",
        value: "DOS-AUT",
      },
      {
        id: "DOS-ASEAN",
        label: "U.S. Mission to ASEAN",
        value: "DOS-ASEAN",
      },
      {
        id: "DOS-BEN",
        label: "U.S. Mission to Benin",
        value: "DOS-BEN",
      },
      {
        id: "DOS-BEL",
        label: "U.S. Mission to Belgium",
        value: "DOS-BEL",
      },
      {
        id: "DOS-BGD",
        label: "U.S. Mission to Bangladesh",
        value: "DOS-BGD",
      },
      {
        id: "DOS-BLR",
        label: "U.S. Mission to Belarus",
        value: "DOS-BLR",
      },
      {
        id: "DOS-BGR",
        label: "U.S. Mission to Bulgaria",
        value: "DOS-BGR",
      },
      {
        id: "DOS-AZE",
        label: "U.S. Mission to Azerbaijan",
        value: "DOS-AZE",
      },
      {
        id: "DOS-BDI",
        label: "U.S. Mission to Burundi",
        value: "DOS-BDI",
      },
      {
        id: "DOS-AUS",
        label: "U.S. Mission to Australia",
        value: "DOS-AUS",
      },
      {
        id: "DOS-BHS",
        label: "U.S. Mission to the Bahamas",
        value: "DOS-BHS",
      },
      {
        id: "DOS-BFA",
        label: "U.S. Mission to Burkina Faso",
        value: "DOS-BFA",
      },
      {
        id: "DOS-BAH",
        label: "U.S. Mission to Bahrain",
        value: "DOS-BAH",
      },
      {
        id: "DOS-BRA",
        label: "U.S. Mission to Brazil",
        value: "DOS-BRA",
      },
      {
        id: "DOS-BRB",
        label: "U.S. Mission to Barbados",
        value: "DOS-BRB",
      },
      {
        id: "DOS-CAN",
        label: "U.S. Mission to Canada",
        value: "DOS-CAN",
      },
      {
        id: "DOS-CHN",
        label: "U.S. Mission to China",
        value: "DOS-CHN",
      },
      {
        id: "DOS-COD",
        label: "U.S. Mission to the Democratic Republic of Congo",
        value: "DOS-COD",
      },
      {
        id: "DOS-CIV",
        label: "U.S. Mission to Cote d Ivoire",
        value: "DOS-CIV",
      },
      {
        id: "DOS-COL",
        label: "U.S. Mission to Colombia",
        value: "DOS-COL",
      },
      {
        id: "DOS-COG",
        label: "U.S. Mission to the Republic of the Congo",
        value: "DOS-COG",
      },
      {
        id: "DOS-CMR",
        label: "U.S. Mission to Cameroon",
        value: "DOS-CMR",
      },
      {
        id: "DOS-CHE",
        label: "U.S. Mission to Switzerland",
        value: "DOS-CHE",
      },
      {
        id: "DOS-CHL",
        label: "U.S. Mission to Chile",
        value: "DOS-CHL",
      },
      {
        id: "DOS-BWA",
        label: "U.S. Mission to Botswana",
        value: "DOS-BWA",
      },
      {
        id: "DOS-BRN",
        label: "U.S. Mission to Brunei",
        value: "DOS-BRN",
      },
      {
        id: "DOS-CPV",
        label: "U.S. Mission to Cape Verde",
        value: "DOS-CPV",
      },
      {
        id: "DOS-CAF",
        label: "U.S. Mission to Central African Republic",
        value: "DOS-CAF",
      },
      {
        id: "DOS-CDP",
        label: "Bureau of Cyberspace and Digital Policy",
        value: "DOS-CDP",
      },
      {
        id: "DOS-EAP",
        label: "Bureau of East Asian and Pacific Affairs ",
        value: "DOS-EAP",
      },
      {
        id: "DOS-DS",
        label: "Bureau of Diplomatic Security",
        value: "DOS-DS",
      },
      {
        id: "DOS-EB",
        label: "Bureau of Economic and Business Affairs",
        value: "DOS-EB",
      },
      {
        id: "DOS-ECA",
        label: "Bureau Of Educational and Cultural Affairs",
        value: "DOS-ECA",
      },
      {
        id: "DOS-DRL",
        label: "Bureau of Democracy Human Rights and Labor",
        value: "DOS-DRL",
      },
      {
        id: "DOS-CYP",
        label: "U.S. Mission to Cyprus",
        value: "DOS-CYP",
      },
      {
        id: "DOS-CRO",
        label: "RECORD ONLY",
        value: "DOS-CRO",
      },
      {
        id: "DOS-CRI",
        label: "U.S. Mission to Costa Rica",
        value: "DOS-CRI",
      },
      {
        id: "DOS-CSO",
        label: "Bureau of Conflict Stabilization Operations",
        value: "DOS-CSO",
      },
      {
        id: "DOS-DOM",
        label: "U.S. Mission to the Dominican Republic",
        value: "DOS-DOM",
      },
      {
        id: "DOS-DEU",
        label: "U.S. Mission to Germany",
        value: "DOS-DEU",
      },
      {
        id: "DOS-CUB",
        label: "U.S. Mission to Cuba",
        value: "DOS-CUB",
      },
      {
        id: "DOS-CZE",
        label: "U.S. Mission to the Czech Republic",
        value: "DOS-CZE",
      },
      {
        id: "DOS-DZA",
        label: "U.S. Mission to Algeria",
        value: "DOS-DZA",
      },
      {
        id: "DOS-DNK",
        label: "U.S. Mission to Denmark",
        value: "DOS-DNK",
      },
      {
        id: "DOS-DJI",
        label: "U.S. Mission to Djibouti",
        value: "DOS-DJI",
      },
      {
        id: "DOS-EUR",
        label: "Bureau of European and Eurasian Affairs",
        value: "DOS-EUR",
      },
      {
        id: "DOS-ECC",
        label: "RECORD ONLY",
        value: "DOS-ECC",
      },
      {
        id: "DOS-ECU",
        label: "U.S. Mission to Ecuador",
        value: "DOS-ECU",
      },
      {
        id: "DOS-ENR",
        label: "Bureau of Energy Resources",
        value: "DOS-ENR",
      },
      {
        id: "DOS-FRA",
        label: "U.S. Mission to France",
        value: "DOS-FRA",
      },
      {
        id: "DOS-GAB",
        label: "U.S. Mission to Gabon",
        value: "DOS-GAB",
      },
      {
        id: "DOS-ETH",
        label: "U.S. Mission to Ethiopia",
        value: "DOS-ETH",
      },
      {
        id: "DOS-EST",
        label: "U.S. Mission to Estonia",
        value: "DOS-EST",
      },
      {
        id: "DOS-FIN",
        label: "U.S. Mission to Finland",
        value: "DOS-FIN",
      },
      {
        id: "DOS-ERI",
        label: "U.S. Mission to Eritrea",
        value: "DOS-ERI",
      },
      {
        id: "DOS-ESP",
        label: "U.S. Mission to Spain",
        value: "DOS-ESP",
      },
      {
        id: "DOS-FRA-ARS",
        label: "Africa Regional Services",
        value: "DOS-FRA-ARS",
      },
      {
        id: "DOS-EGY",
        label: "U.S. Mission to Egypt",
        value: "DOS-EGY",
      },
      {
        id: "DOS-FJI",
        label: "U.S. Mission to Fiji",
        value: "DOS-FJI",
      },
      {
        id: "DOS-GTIP",
        label: "Office to Monitor-Combat Trafficking in Persons",
        value: "DOS-GTIP",
      },
      {
        id: "DOS-HR",
        label: "Bureau of Human Resources",
        value: "DOS-HR",
      },
      {
        id: "DOS-HUN",
        label: "U.S. Mission to Hungary",
        value: "DOS-HUN",
      },
      {
        id: "DOS-GEO",
        label: "U.S. Mission to Georgia",
        value: "DOS-GEO",
      },
      {
        id: "DOS-GTM",
        label: "U.S. Mission to Guatemala",
        value: "DOS-GTM",
      },
      {
        id: "DOS-HTI",
        label: "U.S. Mission to Haiti",
        value: "DOS-HTI",
      },
      {
        id: "DOS-GNQ",
        label: "U.S. Mission to Equatorial Guinea",
        value: "DOS-GNQ",
      },
      {
        id: "DOS-GBR",
        label: "U.S. Mission to the United Kingdom",
        value: "DOS-GBR",
      },
      {
        id: "DOS-GHA",
        label: "U.S. Mission to Ghana",
        value: "DOS-GHA",
      },
      {
        id: "DOS-HND",
        label: "U.S. Mission to Honduras",
        value: "DOS-HND",
      },
      {
        id: "DOS-GIN",
        label: "U.S. Mission to Guinea",
        value: "DOS-GIN",
      },
      {
        id: "DOS-GMB",
        label: "U.S. Mission to Gambia",
        value: "DOS-GMB",
      },
      {
        id: "DOS-HRV",
        label: "U.S. Mission to Croatia",
        value: "DOS-HRV",
      },
      {
        id: "DOS-GCJ",
        label: "Office of Global Criminal Justice",
        value: "DOS-GCJ",
      },
      {
        id: "DOS-GUY",
        label: "U.S. Mission to Guyana",
        value: "DOS-GUY",
      },
      {
        id: "DOS-GRC",
        label: "U.S. Mission to Greece",
        value: "DOS-GRC",
      },
      {
        id: "DOS-INR",
        label: "Bureau of Intelligence and Research",
        value: "DOS-INR",
      },
      {
        id: "DOS-JER",
        label: "U.S. Mission to Jerusalem",
        value: "DOS-JER",
      },
      {
        id: "DOS-IO",
        label: "Bureau of International Organization Affairs",
        value: "DOS-IO",
      },
      {
        id: "DOS-INL",
        label: "Bureau of International Narcotics-Law Enforcement",
        value: "DOS-INL",
      },
      {
        id: "DOS-ISN",
        label: "Bureau of International Security-Nonproliferation",
        value: "DOS-ISN",
      },
      {
        id: "DOS-IND",
        label: "U.S. Mission to India",
        value: "DOS-IND",
      },
      {
        id: "DOS-IRQ",
        label: "U.S. Mission to Iraq",
        value: "DOS-IRQ",
      },
      {
        id: "DOS-IRE",
        label: "U.S. Mission to Ireland",
        value: "DOS-IRE",
      },
      {
        id: "DOS-JOR",
        label: "U.S. Mission to Jordan",
        value: "DOS-JOR",
      },
      {
        id: "DOS-JAM",
        label: "U.S. Mission to Jamaica",
        value: "DOS-JAM",
      },
      {
        id: "DOS-ISR",
        label: "U.S. Mission to Israel",
        value: "DOS-ISR",
      },
      {
        id: "DOS-IDN",
        label: "U.S. Mission to Indonesia",
        value: "DOS-IDN",
      },
      {
        id: "DOS-ITA",
        label: "U.S. Mission to Italy",
        value: "DOS-ITA",
      },
      {
        id: "DOS-LBN",
        label: "U.S. Mission to Lebanon",
        value: "DOS-LBN",
      },
      {
        id: "DOS-KOR",
        label: "U.S. Mission to South Korea",
        value: "DOS-KOR",
      },
      {
        id: "DOS-LTU",
        label: "U.S. Mission to Lithuania",
        value: "DOS-LTU",
      },
      {
        id: "DOS-JPN",
        label: "U.S. Mission to Japan",
        value: "DOS-JPN",
      },
      {
        id: "DOS-KAZ",
        label: "U.S. Mission to Kazakhstan",
        value: "DOS-KAZ",
      },
      {
        id: "DOS-LKA",
        label: "U.S. Mission to Sri Lanka",
        value: "DOS-LKA",
      },
      {
        id: "DOS-KGC",
        label: "U.S. Mission to Kyrgyzstan",
        value: "DOS-KGC",
      },
      {
        id: "DOS-KHM",
        label: "U.S. Mission to Cambodia",
        value: "DOS-KHM",
      },
      {
        id: "DOS-KWT",
        label: "U.S. Mission to Kuwait",
        value: "DOS-KWT",
      },
      {
        id: "DOS-LBR",
        label: "U.S. Mission to Liberia",
        value: "DOS-LBR",
      },
      {
        id: "DOS-MAR",
        label: "U.S. Mission to Morocco",
        value: "DOS-MAR",
      },
      {
        id: "DOS-LAO",
        label: "U.S. Mission to Laos",
        value: "DOS-LAO",
      },
      {
        id: "DOS-LVA",
        label: "U.S. Mission to Latvia",
        value: "DOS-LVA",
      },
      {
        id: "DOS-KEN",
        label: "U.S. Mission to Kenya",
        value: "DOS-KEN",
      },
      {
        id: "DOS-LSO",
        label: "U.S. Mission to Lesotho",
        value: "DOS-LSO",
      },
      {
        id: "DOS-LUX",
        label: "U.S. Mission to Luxembourg",
        value: "DOS-LUX",
      },
      {
        id: "DOS-MHL",
        label: "U.S. Mission to the Marshall Islands",
        value: "DOS-MHL",
      },
      {
        id: "DOS-MLA",
        label: "U.S. Mission to Malaysia",
        value: "DOS-MLA",
      },
      {
        id: "DOS-MEX",
        label: "U.S. Mission to Mexico",
        value: "DOS-MEX",
      },
      {
        id: "DOS-MMR",
        label: "U.S. Mission to Myanmar",
        value: "DOS-MMR",
      },
      {
        id: "DOS-MLI",
        label: "U.S. Mission to Mali",
        value: "DOS-MLI",
      },
      {
        id: "DOS-MDA",
        label: "U.S. Mission to Moldova",
        value: "DOS-MDA",
      },
      {
        id: "DOS-MDG",
        label: "U.S. Mission to Madagascar",
        value: "DOS-MDG",
      },
      {
        id: "DOS-MKD",
        label: "U.S. Mission to North Macedonia",
        value: "DOS-MKD",
      },
      {
        id: "DOS-MOZ",
        label: "U.S. Mission to Mozambique",
        value: "DOS-MOZ",
      },
      {
        id: "DOS-MRT",
        label: "U.S. Mission to Mauritania",
        value: "DOS-MRT",
      },
      {
        id: "DOS-MDV",
        label: "U.S. Mission to the Republic of Maldives",
        value: "DOS-MDV",
      },
      {
        id: "DOS-MNG",
        label: "U.S. Mission to Mongolia",
        value: "DOS-MNG",
      },
      {
        id: "DOS-MUS",
        label: "U.S. Mission to Mauritius",
        value: "DOS-MUS",
      },
      {
        id: "DOS-MLT",
        label: "U.S. Mission to Malta",
        value: "DOS-MLT",
      },
      {
        id: "DOS-MNE",
        label: "U.S. Mission to Montenegro",
        value: "DOS-MNE",
      },
      {
        id: "DOS-NEA",
        label: "Bureau of Near Eastern Affairs",
        value: "DOS-NEA",
      },
      {
        id: "DOS-NEA-MEPI",
        label: "Office of the Middle East Partnership Initiative",
        value: "DOS-NEA-MEPI",
      },
      {
        id: "DOS-NEA-IRAQ",
        label: "Iraq Assistance Office",
        value: "DOS-NEA-IRAQ",
      },
      {
        id: "DOS-NIC",
        label: "U.S. Mission to Nicaragua",
        value: "DOS-NIC",
      },
      {
        id: "DOS-NEA-PPD",
        label: "Press and Public Diplomacy",
        value: "DOS-NEA-PPD",
      },
      {
        id: "DOS-NEA-AC",
        label: "Assistance Coordination",
        value: "DOS-NEA-AC",
      },
      {
        id: "DOS-NER",
        label: "U.S. Mission to Niger",
        value: "DOS-NER",
      },
      {
        id: "DOS-MWI",
        label: "U.S. Mission to Malawi",
        value: "DOS-MWI",
      },
      {
        id: "DOS-NGA",
        label: "U.S. Mission to Nigeria",
        value: "DOS-NGA",
      },
      {
        id: "DOS-NATO",
        label: "U.S. Mission to NATO",
        value: "DOS-NATO",
      },
      {
        id: "DOS-NPL",
        label: "U.S. Mission to Nepal",
        value: "DOS-NPL",
      },
      {
        id: "DOS-NAM",
        label: "U.S. Mission to Namibia",
        value: "DOS-NAM",
      },
      {
        id: "DOS-NLD",
        label: "U.S. Mission to the Netherlands",
        value: "DOS-NLD",
      },
      {
        id: "DOS-NOR",
        label: "U.S. Mission to Norway",
        value: "DOS-NOR",
      },
      {
        id: "DOS-OES",
        label: "Bureau of Oceans - Int. Environmental - Scientific",
        value: "DOS-OES",
      },
      {
        id: "DOS-PRM",
        label: "Bureau of Population Refugees and Migration",
        value: "DOS-PRM",
      },
      {
        id: "DOS-PA",
        label: "Bureau of Global Public Affairs",
        value: "DOS-PA",
      },
      {
        id: "DOS-PMWRA",
        label: "Bureau of Political-Military Affairs - WRA",
        value: "DOS-PMWRA",
      },
      {
        id: "DOS-PRY",
        label: "U.S. Mission to Paraguay",
        value: "DOS-PRY",
      },
      {
        id: "DOS-PAK",
        label: "U.S. Mission to Pakistan",
        value: "DOS-PAK",
      },
      {
        id: "DOS-PAN",
        label: "U.S. Mission to Panama",
        value: "DOS-PAN",
      },
      {
        id: "DOS-PRT",
        label: "U.S. Mission to Portugal",
        value: "DOS-PRT",
      },
      {
        id: "DOS-PHL",
        label: "U.S. Mission to the Philippines",
        value: "DOS-PHL",
      },
      {
        id: "DOS-PNG",
        label: "U.S. Mission to Papua New Guinea",
        value: "DOS-PNG",
      },
      {
        id: "DOS-QAT",
        label: "U.S. Mission to Qatar",
        value: "DOS-QAT",
      },
      {
        id: "DOS-PER",
        label: "U.S. Mission to Peru",
        value: "DOS-PER",
      },
      {
        id: "DOS-PMGPI",
        label: "Bureau of Political-Military Affairs - GPI",
        value: "DOS-PMGPI",
      },
      {
        id: "DOS-POL",
        label: "U.S. Mission to Poland",
        value: "DOS-POL",
      },
      {
        id: "DOS-NZL",
        label: "U.S. Mission to New Zealand",
        value: "DOS-NZL",
      },
      {
        id: "DOS-SA",
        label: "Bureau of South and Central Asian Affairs",
        value: "DOS-SA",
      },
      {
        id: "DOS-SCT",
        label: "Bureau of Counterterrorism ",
        value: "DOS-SCT",
      },
      {
        id: "DOS-SGWI",
        label: "RECORD ONLY",
        value: "DOS-SGWI",
      },
      {
        id: "DOS-SBUR",
        label: "Office of the Secretary",
        value: "DOS-SBUR",
      },
      {
        id: "DOS-SBUR-SCT",
        label: "RECORD ONLY",
        value: "DOS-SBUR-SCT",
      },
      {
        id: "DOS-SBUR-SGWI",
        label: "Office of Global Womens Issues",
        value: "DOS-SBUR-SGWI",
      },
      {
        id: "DOS-SAU",
        label: "U.S. Mission to Saudi Arabia",
        value: "DOS-SAU",
      },
      {
        id: "DOS-RUS",
        label: "U.S. Mission to Russia",
        value: "DOS-RUS",
      },
      {
        id: "DOS-RWA",
        label: "U.S. Mission to Rwanda",
        value: "DOS-RWA",
      },
      {
        id: "DOS-SLV",
        label: "U.S. Mission to El Salvador",
        value: "DOS-SLV",
      },
      {
        id: "DOS-SEN",
        label: "U.S. Mission to Senegal",
        value: "DOS-SEN",
      },
      {
        id: "DOS-SLE",
        label: "U.S. Mission to Sierra Leone",
        value: "DOS-SLE",
      },
      {
        id: "DOS-SGP",
        label: "U.S. Mission to Singapore",
        value: "DOS-SGP",
      },
      {
        id: "DOS-SDN",
        label: "U.S. Mission to Sudan",
        value: "DOS-SDN",
      },
      {
        id: "DOS-ROU",
        label: "U.S. Mission to Romania",
        value: "DOS-ROU",
      },
      {
        id: "DOS-TUR",
        label: "U.S. Mission to Turkey",
        value: "DOS-TUR",
      },
      {
        id: "DOS-TUN",
        label: "U.S. Mission to Tunisia",
        value: "DOS-TUN",
      },
      {
        id: "DOS-TTO",
        label: "U.S. Mission to Trinidad and Tobago",
        value: "DOS-TTO",
      },
      {
        id: "DOS-TKM",
        label: "U.S. Mission to Turkmenistan",
        value: "DOS-TKM",
      },
      {
        id: "DOS-TCD",
        label: "U.S. Mission to Chad",
        value: "DOS-TCD",
      },
      {
        id: "DOS-TGO",
        label: "U.S. Mission to Togo",
        value: "DOS-TGO",
      },
      {
        id: "DOS-TLS",
        label: "U.S. Mission to Timor-Leste",
        value: "DOS-TLS",
      },
      {
        id: "DOS-SVK",
        label: "U.S. Mission to Slovakia ",
        value: "DOS-SVK",
      },
      {
        id: "DOS-TJK",
        label: "U.S. Mission to Tajikistan",
        value: "DOS-TJK",
      },
      {
        id: "DOS-SSD",
        label: "U.S. Mission to South Sudan",
        value: "DOS-SSD",
      },
      {
        id: "DOS-SVN",
        label: "U.S. Mission to Slovenia",
        value: "DOS-SVN",
      },
      {
        id: "DOS-THA",
        label: "U.S. Mission to Thailand",
        value: "DOS-THA",
      },
      {
        id: "DOS-SUR",
        label: "U.S. Mission to Suriname",
        value: "DOS-SUR",
      },
      {
        id: "DOS-SWE",
        label: "U.S. Mission to Sweden",
        value: "DOS-SWE",
      },
      {
        id: "DOS-SWZ",
        label: "U.S. Mission to Eswatini",
        value: "DOS-SWZ",
      },
      {
        id: "DOS-SRB",
        label: "U.S. Mission to Serbia",
        value: "DOS-SRB",
      },
      {
        id: "DOS-SOM",
        label: "U.S. Mission to Somalia",
        value: "DOS-SOM",
      },
      {
        id: "DOS-WHA",
        label: "Bureau of Western Hemisphere Affairs",
        value: "DOS-WHA",
      },
      {
        id: "DOS-ZAM",
        label: "U.S. Mission to Zambia",
        value: "DOS-ZAM",
      },
      {
        id: "DOS-USSES",
        label: "RECORD ONLY",
        value: "DOS-USSES",
      },
      {
        id: "DOS-UKR",
        label: "U.S. Mission to Ukraine",
        value: "DOS-UKR",
      },
      {
        id: "DOS-ZWE",
        label: "U.S. Mission to Zimbabwe",
        value: "DOS-ZWE",
      },
      {
        id: "DOS-ZAF",
        label: "U.S. Mission to South Africa",
        value: "DOS-ZAF",
      },
      {
        id: "DOS-UGA",
        label: "U.S. Mission to Uganda",
        value: "DOS-UGA",
      },
      {
        id: "DOS-VNM",
        label: "U.S. Mission to Vietnam",
        value: "DOS-VNM",
      },
      {
        id: "DOS-XKX",
        label: "U.S. Mission to Kosovo",
        value: "DOS-XKX",
      },
      {
        id: "DOS-URY",
        label: "U.S. Mission to Uruguay",
        value: "DOS-URY",
      },
      {
        id: "DOS-USUN",
        label: "U.S. Mission to the United Nations",
        value: "DOS-USUN",
      },
      {
        id: "DOS-TZA",
        label: "U.S. Mission to Tanzania",
        value: "DOS-TZA",
      },
      {
        id: "DOS-USEU",
        label: "U.S. Mission to the European Union",
        value: "DOS-USEU",
      },
      {
        id: "DOS-UZB",
        label: "U.S. Mission to Uzbekistan",
        value: "DOS-UZB",
      },
      {
        id: "DOS-VEN",
        label: "U.S. Mission to Venezuela",
        value: "DOS-VEN",
      },
      {
        id: "DOS-UNVIE",
        label: "U.S. Mission to the International Organizations",
        value: "DOS-UNVIE",
      },
    ],
  },
  {
    id: "DOT",
    label: "Department of Transportation",
    value: "DOT",
    children: [
      {
        id: "DOT-FAA",
        label: "DOT Federal Aviation Administration ",
        value: "DOT-FAA",
      },
      {
        id: "DOT-DOT X-50",
        label: "69A345 Office of the Under Secretary for Policy",
        value: "DOT-DOT X-50",
      },
      {
        id: "DOT-FAA-FAA ARG",
        label: "DOT - FAA Aviation Research Grants",
        value: "DOT-FAA-FAA ARG",
      },
      {
        id: "DOT-FAA-FAA COE",
        label: "DOT - FAA Centers of Excellence",
        value: "DOT-FAA-FAA COE",
      },
      {
        id: "DOT-DOT X-50-OAA",
        label: "Inactive Site",
        value: "DOT-DOT X-50-OAA",
      },
      {
        id: "DOT-FAA-FAA COE-AJFE",
        label: "FAA-COE-AJFE",
        value: "DOT-FAA-FAA COE-AJFE",
      },
      {
        id: "DOT-FAA-AIP",
        label: "Airport Improvement Program Discretionary Grants",
        value: "DOT-FAA-AIP",
      },
      {
        id: "DOT-FAA-AWDG",
        label: "Aviation Workforce Development Grant Program",
        value: "DOT-FAA-AWDG",
      },
      {
        id: "DOT-FAA-ANG",
        label: "FAA - Aviation Next Gen",
        value: "DOT-FAA-ANG",
      },
      {
        id: "DOT-FMCSA",
        label: "DOT-Federal Motor Carrier Safety Administration",
        value: "DOT-FMCSA",
      },
      {
        id: "DOT-FHWA",
        label: "DOT Federal Highway Administration ",
        value: "DOT-FHWA",
      },
      {
        id: "DOT-FRA",
        label: "DOT - Federal Railroad Administration",
        value: "DOT-FRA",
      },
      {
        id: "DOT-FAA-FAA COE-FAA JAMS",
        label: "FAA-COE-JAMS",
        value: "DOT-FAA-FAA COE-FAA JAMS",
      },
      {
        id: "DOT-FAA-FAA COE-GACOE",
        label: "FAA-COE-GA",
        value: "DOT-FAA-FAA COE-GACOE",
      },
      {
        id: "DOT-FAA-FAA COE-TTHP",
        label: "FAA-COE-TTHP",
        value: "DOT-FAA-FAA COE-TTHP",
      },
      {
        id: "DOT-OST OSDBU",
        label: "DOT OSDBU",
        value: "DOT-OST OSDBU",
      },
      {
        id: "DOT-NHTSA",
        label: "National Highway Traffic Safety Administration",
        value: "DOT-NHTSA",
      },
      {
        id: "DOT-FTA",
        label: "DOT/Federal Transit Administration",
        value: "DOT-FTA",
      },
      {
        id: "DOT-FTA - TPM",
        label: "DOT-Federal Transit Administration - Inactive Site",
        value: "DOT-FTA - TPM",
      },
      {
        id: "DOT-PHMSA",
        label: "Pipeline and Hazardous Materials Safety Admin",
        value: "DOT-PHMSA",
      },
      {
        id: "DOT-RITA",
        label: "69A355 Research and Technology",
        value: "DOT-RITA",
      },
      {
        id: "DOT-MA",
        label: "Maritime Administration",
        value: "DOT-MA",
      },
      {
        id: "DOT-OSDBU",
        label: "69A350 OSDBU",
        value: "DOT-OSDBU",
      },
      {
        id: "DOT-PHMSA-DOTPHH",
        label: "PHMSA Hazmat Grants - Inactive",
        value: "DOT-PHMSA-DOTPHH",
      },
    ],
  },
  {
    id: "ED",
    label: "Department of Education",
    value: "ED",
  },
  {
    id: "EPA",
    label: "Environmental Protection Agency",
    value: "EPA",
  },
  {
    id: "FCC",
    label: "Federal Communications Commission",
    value: "FCC",
  },
  {
    id: "GSA",
    label: "General Services Administration",
    value: "GSA",
  },
  {
    id: "HHS",
    label: "Department of Health and Human Services",
    value: "HHS",
    children: [
      {
        id: "HHS-SAMHS-SAMHSA",
        label: "Substance Abuse and Mental Health Services Adminis",
        value: "HHS-SAMHS-SAMHSA",
      },
      {
        id: "HHS-SAMHS",
        label: "Substance Abuse and Mental Health Services Admin",
        value: "HHS-SAMHS",
      },
      {
        id: "HHS-ACF",
        label: "Administration for Children and Families",
        value: "HHS-ACF",
      },
      {
        id: "HHS-ACF-ANA",
        label: "Administration for Children and Families - ANA",
        value: "HHS-ACF-ANA",
      },
      {
        id: "HHS-ACF-CB",
        label: "Administration for Children and Families - ACYF/CB",
        value: "HHS-ACF-CB",
      },
      {
        id: "HHS-AHRQ",
        label: "Agency for Health Care Research and Quality",
        value: "HHS-AHRQ",
      },
      {
        id: "HHS-ACF-OHSEPR",
        label: "Administration for Children and Families - OHSEPR",
        value: "HHS-ACF-OHSEPR",
      },
      {
        id: "HHS-ACF-OPRE",
        label: "Administration for Children and Families - OPRE",
        value: "HHS-ACF-OPRE",
      },
      {
        id: "HHS-ACF-OFA",
        label: "Administration for Children and Families - OFA",
        value: "HHS-ACF-OFA",
      },
      {
        id: "HHS-ACF-FYSB",
        label: "Administration for Children & Families - ACYF/FYSB",
        value: "HHS-ACF-FYSB",
      },
      {
        id: "HHS-ACF-OCSE",
        label: "Administration for Children and Families - OCSE",
        value: "HHS-ACF-OCSE",
      },
      {
        id: "HHS-ACL",
        label: "Administration for Community Living",
        value: "HHS-ACL",
      },
      {
        id: "HHS-ACF-OCC",
        label: "Administration for Children and Families - OCC",
        value: "HHS-ACF-OCC",
      },
      {
        id: "HHS-ACF-ORR",
        label: "Administration for Children and Families - ORR",
        value: "HHS-ACF-ORR",
      },
      {
        id: "HHS-ACF-OHS",
        label: "Administration for Children and Families - OHS",
        value: "HHS-ACF-OHS",
      },
      {
        id: "HHS-ACF-OCS",
        label: "Administration for Children and Families - OCS",
        value: "HHS-ACF-OCS",
      },
      {
        id: "HHS-ACF-OTIP",
        label: "Administration for Children and Families-IOAS-OTIP",
        value: "HHS-ACF-OTIP",
      },
      {
        id: "HHS-ACF-OCSS",
        label: "Administration for Children and Families - OCSS",
        value: "HHS-ACF-OCSS",
      },
      {
        id: "HHS-ACF-OFVPS",
        label: "Administration for Children and Families - OFVPS",
        value: "HHS-ACF-OFVPS",
      },
      {
        id: "HHS-AOA",
        label: "Administration on Aging",
        value: "HHS-AOA",
      },
      {
        id: "HHS-CDC",
        label: "Centers for Disease Control and Prevention",
        value: "HHS-CDC",
      },
      {
        id: "HHS-CDC-HHSCDCERA",
        label: "Centers for Disease Control and Prevention - ERA",
        value: "HHS-CDC-HHSCDCERA",
      },
      {
        id: "HHS-CDC-NCCDPHP",
        label: "Centers for Disease Control - NCCDPHP",
        value: "HHS-CDC-NCCDPHP",
      },
      {
        id: "HHS-CDC-ATSDR",
        label: "Centers for Disease Control - ATSDR",
        value: "HHS-CDC-ATSDR",
      },
      {
        id: "HHS-CDC-NCBDDD",
        label: "Centers for Disease Control - NCBDDD",
        value: "HHS-CDC-NCBDDD",
      },
      {
        id: "HHS-CDC-CGH",
        label: "Centers for Disease Control - CGH",
        value: "HHS-CDC-CGH",
      },
      {
        id: "HHS-CDC-CSELS",
        label: "Centers for Disease Control - CSELS",
        value: "HHS-CDC-CSELS",
      },
      {
        id: "HHS-CDC-CSTLTS",
        label: "CENTERS FOR DISEASE CONTROL  CSTLTS",
        value: "HHS-CDC-CSTLTS",
      },
      {
        id: "HHS-ARPAH",
        label: "Advanced Research Projects Agency for Health",
        value: "HHS-ARPAH",
      },
      {
        id: "HHS-CDC-CFA",
        label: "Centers for Disease Control - CFA",
        value: "HHS-CDC-CFA",
      },
      {
        id: "HHS-CDC-NIOSH",
        label: "Centers for Disease Control - NIOSH",
        value: "HHS-CDC-NIOSH",
      },
      {
        id: "HHS-CDC-GHC",
        label: "Centers for Disease Control-GHC",
        value: "HHS-CDC-GHC",
      },
      {
        id: "HHS-ASPR",
        label: "Admin for Strategic Preparedness and Response",
        value: "HHS-ASPR",
      },
      {
        id: "HHS-CMS",
        label: "Centers for Medicare & Medicaid Services",
        value: "HHS-CMS",
      },
      {
        id: "HHS-FDA",
        label: "Food and Drug Administration",
        value: "HHS-FDA",
      },
      {
        id: "HHS-CDC-NCHHSTP",
        label: "Centers for Disease Control - NCHHSTP",
        value: "HHS-CDC-NCHHSTP",
      },
      {
        id: "HHS-CDC-NCIPC",
        label: "Centers for Disease Control - NCIPC",
        value: "HHS-CDC-NCIPC",
      },
      {
        id: "HHS-CMS-CCIIO-COOP",
        label: "CMS Consumer Operated and Oriented Plan Program",
        value: "HHS-CMS-CCIIO-COOP",
      },
      {
        id: "HHS-CDC-OD",
        label: "Centers for Disease Control - OD",
        value: "HHS-CDC-OD",
      },
      {
        id: "HHS-CDC-OPHPR",
        label: "Centers for Disease Control - OPHPR",
        value: "HHS-CDC-OPHPR",
      },
      {
        id: "HHS-CDC-OSTLTS",
        label: "Centers for Disease Control - OSTLTS",
        value: "HHS-CDC-OSTLTS",
      },
      {
        id: "HHS-CDC-NCEH",
        label: "Centers for Disease Control - NCEH",
        value: "HHS-CDC-NCEH",
      },
      {
        id: "HHS-CDC-NCEZID",
        label: "Centers for Disease Control - NCEZID",
        value: "HHS-CDC-NCEZID",
      },
      {
        id: "HHS-CDC-NCHS",
        label: "Centers for Disease Control - NCHS",
        value: "HHS-CDC-NCHS",
      },
      {
        id: "HHS-CDC-NCIRD",
        label: "Centers for Disease Control - NCIRD",
        value: "HHS-CDC-NCIRD",
      },
      {
        id: "HHS-CDC-PHIC",
        label: "Centers for Disease Control-PHIC",
        value: "HHS-CDC-PHIC",
      },
      {
        id: "HHS-CDC-ORR",
        label: "Centers for Disease Control - ORR",
        value: "HHS-CDC-ORR",
      },
      {
        id: "HHS-OPHS",
        label: "Office of the Assistant Secretary for Health",
        value: "HHS-OPHS",
      },
      {
        id: "HHS-HRSA",
        label: "Health Resources and Services Administration",
        value: "HHS-HRSA",
      },
      {
        id: "HHS-NIH11",
        label: "National Institutes of Health",
        value: "HHS-NIH11",
      },
      {
        id: "HHS-IHS",
        label: "Indian Health Service",
        value: "HHS-IHS",
      },
      {
        id: "HHS-NIH11-OD",
        label: "National Institutes of Health",
        value: "HHS-NIH11-OD",
      },
      {
        id: "HHS-OS-ASPE",
        label: "Assistant Secretary for Planning and Evaluation",
        value: "HHS-OS-ASPE",
      },
      {
        id: "HHS-OS-ASPR",
        label: "Assistant Secretary for Preparedness and Response",
        value: "HHS-OS-ASPR",
      },
      {
        id: "HHS-OS-OCIIO",
        label: "CMS-Consumer Information & Insurance Oversight",
        value: "HHS-OS-OCIIO",
      },
      {
        id: "HHS-OS-ONC",
        label: "Office of the National Coordinator",
        value: "HHS-OS-ONC",
      },
    ],
  },
  {
    id: "NEH",
    label: "National Endowment for the Humanities",
    value: "NEH",
  },
  {
    id: "HUD",
    label: "Department of Housing and Urban Development",
    value: "HUD",
  },
  {
    id: "IMLS",
    label: "Institute of Museum and Library Services",
    value: "IMLS",
  },
  {
    id: "IAF",
    label: "Inter-American Foundation",
    value: "IAF",
  },
  {
    id: "LOC",
    label: "Library of Congress",
    value: "LOC",
  },
  {
    id: "NARA",
    label: "National Archives and Records Administration",
    value: "NARA",
  },
  {
    id: "NASA",
    label: "National Aeronautics and Space Administration",
    value: "NASA",
    children: [
      {
        id: "NASA-GSFC",
        label: "NASA Goddard Space Flight Center",
        value: "NASA-GSFC",
      },
      {
        id: "NASA-HQ",
        label: "NASA Headquarters",
        value: "NASA-HQ",
      },
      {
        id: "NASA-JSC",
        label: "NASA Johnson Space Center",
        value: "NASA-JSC",
      },
      {
        id: "NASA-KSC",
        label: "NASA Kennedy Space Center",
        value: "NASA-KSC",
      },
      {
        id: "NASA-ARC",
        label: "NASA Ames Research Center",
        value: "NASA-ARC",
      },
      {
        id: "NASA-DFRC",
        label: "NASA Armstrong Flight Research Center",
        value: "NASA-DFRC",
      },
      {
        id: "NASA-SFC",
        label: "NASA Marshall Space Flight Center",
        value: "NASA-SFC",
      },
      {
        id: "NASA-GRC",
        label: "NASA Glenn Research Center",
        value: "NASA-GRC",
      },
      {
        id: "NASA-LRC",
        label: "NASA Langley Research Center",
        value: "NASA-LRC",
      },
      {
        id: "NASA-SSC",
        label: "NASA Stennis Space Center",
        value: "NASA-SSC",
      },
    ],
  },
  {
    id: "NCUA",
    label: "National Credit Union Administration",
    value: "NCUA",
  },
  {
    id: "NCD",
    label: "National Council on Disability",
    value: "NCD",
  },
  {
    id: "NEA",
    label: "National Endowment for the Arts",
    value: "NEA",
    children: [
      {
        id: "NEA-CA",
        label: "NEA Cooperative Agreements Office",
        value: "NEA-CA",
      },
    ],
  },
  {
    id: "NSF",
    label: "National Science Foundation",
    value: "NSF",
  },
  {
    id: "ODNI",
    label: "Office of the Director of National Intelligence",
    value: "ODNI",
  },
  {
    id: "NRC",
    label: "Nuclear Regulatory Commission",
    value: "NRC",
  },
  {
    id: "PAMS",
    label: "Department of Energy - Office of Science",
    value: "PAMS",
    children: [
      {
        id: "PAMS-SC",
        label: "Office of Science",
        value: "PAMS-SC",
      },
    ],
  },
  {
    id: "ONDCP",
    label: "Office of National Drug Control Policy ",
    value: "ONDCP",
  },
  {
    id: "USAID",
    label: "Agency for International Development",
    value: "USAID",
    children: [
      {
        id: "USAID-AFG",
        label: "Afghanistan USAID-Kabul",
        value: "USAID-AFG",
      },
      {
        id: "USAID-ARM",
        label: "Armenia USAID-Yerevan",
        value: "USAID-ARM",
      },
      {
        id: "USAID-ALB",
        label: "Albania USAID-Tirana",
        value: "USAID-ALB",
      },
      {
        id: "USAID-AZE",
        label: "Azerbaijan USAID-Baku",
        value: "USAID-AZE",
      },
      {
        id: "USAID-DEM",
        label: "Democratic Republic of the Congo USAID-Kinshasa",
        value: "USAID-DEM",
      },
      {
        id: "USAID-CAM",
        label: "Cambodia USAID-Phnom Penh",
        value: "USAID-CAM",
      },
      {
        id: "USAID-BOL",
        label: "Bolivia USAID-La Paz",
        value: "USAID-BOL",
      },
      {
        id: "USAID-BRA",
        label: "Brazil USAID-Brasilia",
        value: "USAID-BRA",
      },
      {
        id: "USAID-COL",
        label: "Colombia USAID-Bogota",
        value: "USAID-COL",
      },
      {
        id: "USAID-BEN",
        label: "Benin USAID-Cotonou",
        value: "USAID-BEN",
      },
      {
        id: "USAID-BAN",
        label: "Bangladesh USAID-Dhaka",
        value: "USAID-BAN",
      },
      {
        id: "USAID-BOS",
        label: "Bosnia USAID-Herzegovina",
        value: "USAID-BOS",
      },
      {
        id: "USAID-BUR",
        label: "Burundi USAID-Bujumbura",
        value: "USAID-BUR",
      },
      {
        id: "USAID-BAR",
        label: "USAID - Barbados and Eastern Caribbean",
        value: "USAID-BAR",
      },
      {
        id: "USAID-COI",
        label: "Cote d Ivoire USAID - Abidjan",
        value: "USAID-COI",
      },
      {
        id: "USAID-BMA",
        label: "Burma USAID - Rangoon",
        value: "USAID-BMA",
      },
      {
        id: "USAID-EGY",
        label: "Egypt USAID-Cairo",
        value: "USAID-EGY",
      },
      {
        id: "USAID-ECU",
        label: "Ecuador USAID-Quito",
        value: "USAID-ECU",
      },
      {
        id: "USAID-GEO",
        label: "Georgia USAID-Tbilisi",
        value: "USAID-GEO",
      },
      {
        id: "USAID-GUI",
        label: "Guinea USAID-Conakry",
        value: "USAID-GUI",
      },
      {
        id: "USAID-DOM",
        label: "Dominican Republic USAID-Santo Domingo",
        value: "USAID-DOM",
      },
      {
        id: "USAID-ETH",
        label: "Ethiopia USAID-Addis Ababa ",
        value: "USAID-ETH",
      },
      {
        id: "USAID-HON",
        label: "Honduras USAID-Tegucigalpa",
        value: "USAID-HON",
      },
      {
        id: "USAID-GUA",
        label: "Guatemala USAID-Guatemala City",
        value: "USAID-GUA",
      },
      {
        id: "USAID-GHA",
        label: "Ghana USAID-Accra",
        value: "USAID-GHA",
      },
      {
        id: "USAID-ELS",
        label: "El Salvador USAID-San Salvador",
        value: "USAID-ELS",
      },
      {
        id: "USAID-HAI",
        label: "Haiti USAID-Port Au Prince",
        value: "USAID-HAI",
      },
      {
        id: "USAID-EAF",
        label: "East Africa USAID-Kenya",
        value: "USAID-EAF",
      },
      {
        id: "USAID-GS",
        label: "USAID",
        value: "USAID-GS",
      },
      {
        id: "USAID-GER",
        label: "Germany USAID - Frankfurt",
        value: "USAID-GER",
      },
      {
        id: "USAID-IRA",
        label: "Iraq USAID-Baghdad",
        value: "USAID-IRA",
      },
      {
        id: "USAID-JAM",
        label: "Jamaica USAID-Kingston",
        value: "USAID-JAM",
      },
      {
        id: "USAID-JOR",
        label: "Jordan USAID-Amman",
        value: "USAID-JOR",
      },
      {
        id: "USAID-KAZ",
        label: "Kazakhstan USAID-Almaty",
        value: "USAID-KAZ",
      },
      {
        id: "USAID-KEN",
        label: "Kenya USAID-Nairobi",
        value: "USAID-KEN",
      },
      {
        id: "USAID-IND",
        label: "Indonesia USAID-Jakarta",
        value: "USAID-IND",
      },
      {
        id: "USAID-HUN",
        label: "Hungary USAID-Budapest",
        value: "USAID-HUN",
      },
      {
        id: "USAID-INA",
        label: "India USAID-New Delhi",
        value: "USAID-INA",
      },
      {
        id: "USAID-LEB",
        label: "Lebanon USAID-Beirut",
        value: "USAID-LEB",
      },
      {
        id: "USAID-LIB",
        label: "Liberia USAID-Monrovia",
        value: "USAID-LIB",
      },
      {
        id: "USAID-MAC",
        label: "Macedonia USAID-Skopje",
        value: "USAID-MAC",
      },
      {
        id: "USAID-KOS",
        label: "Kosovo USAID-Pristina",
        value: "USAID-KOS",
      },
      {
        id: "USAID-MOR",
        label: "Morocco USAID-Rabat",
        value: "USAID-MOR",
      },
      {
        id: "USAID-PAK",
        label: "Pakistan USAID-Islamabad",
        value: "USAID-PAK",
      },
      {
        id: "USAID-MAD",
        label: "Madagascar USAID-Antananarivo",
        value: "USAID-MAD",
      },
      {
        id: "USAID-MAL",
        label: "Mali USAID -Bamako",
        value: "USAID-MAL",
      },
      {
        id: "USAID-NEP",
        label: "Nepal USAID-Kathmandu",
        value: "USAID-NEP",
      },
      {
        id: "USAID-NIC",
        label: "Nicaragua USAID-Managua",
        value: "USAID-NIC",
      },
      {
        id: "USAID-NIG",
        label: "Nigeria USAID-Abuja",
        value: "USAID-NIG",
      },
      {
        id: "USAID-MOZ",
        label: "Mozambique USAID-Maputo",
        value: "USAID-MOZ",
      },
      {
        id: "USAID-MOL",
        label: "Moldova USAID-Chisinau",
        value: "USAID-MOL",
      },
      {
        id: "USAID-MON",
        label: "Mongolia USAID-Ulaanbaatar",
        value: "USAID-MON",
      },
      {
        id: "USAID-MLW",
        label: "Malawi USAID-Lilongwe",
        value: "USAID-MLW",
      },
      {
        id: "USAID-MEX",
        label: "Mexico USAID-Mexico City",
        value: "USAID-MEX",
      },
      {
        id: "USAID-MERP",
        label: "Middle East Regional Platform USAID-MERP",
        value: "USAID-MERP",
      },
      {
        id: "USAID-PER",
        label: "Peru USAID-Lima",
        value: "USAID-PER",
      },
      {
        id: "USAID-RWA",
        label: "Rwanda USAID-Kigali ",
        value: "USAID-RWA",
      },
      {
        id: "USAID-SEN",
        label: "Senegal USAID-Dakar",
        value: "USAID-SEN",
      },
      {
        id: "USAID-RUS",
        label: "Russia USAID-Moscow",
        value: "USAID-RUS",
      },
      {
        id: "USAID-SUD",
        label: "Sudan USAID-Khartoum",
        value: "USAID-SUD",
      },
      {
        id: "USAID-PHI",
        label: "Philippines USAID-Manila",
        value: "USAID-PHI",
      },
      {
        id: "USAID-SRI",
        label: "Sri Lanka USAID-Colombo",
        value: "USAID-SRI",
      },
      {
        id: "USAID-SAF",
        label: "South Africa USAID-Pretoria",
        value: "USAID-SAF",
      },
      {
        id: "USAID-TAN",
        label: "Tanzania USAID-Dar es Salaam",
        value: "USAID-TAN",
      },
      {
        id: "USAID-PAR",
        label: "Paraguay USAID-Asuncion",
        value: "USAID-PAR",
      },
      {
        id: "USAID-SER",
        label: "Serbia USAID-Belgrade",
        value: "USAID-SER",
      },
      {
        id: "USAID-SOM",
        label: "Somalia USAID-Mogadishu",
        value: "USAID-SOM",
      },
      {
        id: "USAID-PAN",
        label: "Panama USAID-Panama City",
        value: "USAID-PAN",
      },
      {
        id: "USAID-TAJ",
        label: "Tajikistan USAID-Dushanbe",
        value: "USAID-TAJ",
      },
      {
        id: "USAID-SSD",
        label: "South Sudan (USAID)-Juba",
        value: "USAID-SSD",
      },
      {
        id: "USAID-UKR",
        label: "Ukraine USAID-Kiev",
        value: "USAID-UKR",
      },
      {
        id: "USAID-WES",
        label: "West Bank, Gaza USAID-West Bank",
        value: "USAID-WES",
      },
      {
        id: "USAID-THA",
        label: "Thailand USAID-Bangkok",
        value: "USAID-THA",
      },
      {
        id: "USAID-UGA",
        label: "Uganda USAID-Kampala",
        value: "USAID-UGA",
      },
      {
        id: "USAID-ZAM",
        label: "Zambia USAID-Lusaka",
        value: "USAID-ZAM",
      },
      {
        id: "USAID-ZIM",
        label: "Zimbabwe USAID-Harare",
        value: "USAID-ZIM",
      },
      {
        id: "USAID-UZB",
        label: "Uzbekistan USAID-Tashkent",
        value: "USAID-UZB",
      },
      {
        id: "USAID-YEM",
        label: "Yemen USAID-Sanaa",
        value: "USAID-YEM",
      },
      {
        id: "USAID-VIE",
        label: "USAID-VIETNAM",
        value: "USAID-VIE",
      },
      {
        id: "USAID-WAF",
        label: "West Africa USAID-Ghana",
        value: "USAID-WAF",
      },
    ],
  },
  {
    id: "SBA",
    label: "Small Business Administration",
    value: "SBA",
  },
  {
    id: "SSA",
    label: "Social Security Administration",
    value: "SSA",
    children: [
      {
        id: "SSA-SSA11",
        label: "ODISP- OESP",
        value: "SSA-SSA11",
      },
      {
        id: "SSA-SSA1",
        label: "Office of Policy ORES",
        value: "SSA-SSA1",
      },
    ],
  },
  {
    id: "SCRC",
    label: "Southeast Crescent Regional Commission",
    value: "SCRC",
  },
  {
    id: "USDA",
    label: "Department of Agriculture",
    value: "USDA",
    children: [
      {
        id: "USDA-RBCS",
        label: "Rural Business-Cooperative Service ",
        value: "USDA-RBCS",
      },
      {
        id: "USDA-RUS",
        label: "Rural Utilities Service",
        value: "USDA-RUS",
      },
      {
        id: "USDA-AMS",
        label: "Agricultural Marketing Service",
        value: "USDA-AMS",
      },
      {
        id: "USDA-CSREE",
        label: "CSREES",
        value: "USDA-CSREE",
      },
      {
        id: "USDA-APHIS",
        label: "Animal and Plant Health Inspection Service",
        value: "USDA-APHIS",
      },
      {
        id: "USDA-FAS",
        label: "Foreign Agricultural Service",
        value: "USDA-FAS",
      },
      {
        id: "USDA-FAS-GP-10601",
        label: "Market Access Program 10.601",
        value: "USDA-FAS-GP-10601",
      },
      {
        id: "USDA-FAS-GP-10605",
        label: "Quality Samples Program 10.605",
        value: "USDA-FAS-GP-10605",
      },
      {
        id: "USDA-FAS-GP-10608",
        label: "McGovern-Dole Food for Education 10.608",
        value: "USDA-FAS-GP-10608",
      },
      {
        id: "USDA-FAS-GP-10600",
        label: "Foreign Market Development Cooperator Prog 10600",
        value: "USDA-FAS-GP-10600",
      },
      {
        id: "USDA-FAS-GP-10612",
        label: "Local and Regional Food Aid Procure Pgm LRP 10612",
        value: "USDA-FAS-GP-10612",
      },
      {
        id: "USDA-FAS-GP-10606",
        label: "Food for Progress 10.606",
        value: "USDA-FAS-GP-10606",
      },
      {
        id: "USDA-FAS-GP-10617",
        label: "Section 108 Foreign Currency 10.617",
        value: "USDA-FAS-GP-10617",
      },
      {
        id: "USDA-FAS-GP-10603",
        label: "Emerging Markets Program 10.603",
        value: "USDA-FAS-GP-10603",
      },
      {
        id: "USDA-FAS-GP-10604",
        label: "Technical Assistance for Specialty Crops 10.604",
        value: "USDA-FAS-GP-10604",
      },
      {
        id: "USDA-FAS-GP-10618",
        label: "Agricultural Trade Promotion Program 10.618",
        value: "USDA-FAS-GP-10618",
      },
      {
        id: "USDA-FAS-GP-10777",
        label: "Norman E. Borlaug Intl Ag Science and Tech 10.777",
        value: "USDA-FAS-GP-10777",
      },
      {
        id: "USDA-FAS-GP-10619",
        label: "International Agricultural Educ Fellowship 10.619",
        value: "USDA-FAS-GP-10619",
      },
      {
        id: "USDA-FAS-GP-10613",
        label: "Faculty Exchange Program 10.613",
        value: "USDA-FAS-GP-10613",
      },
      {
        id: "USDA-FNS1",
        label: "Food and Nutrition Service",
        value: "USDA-FNS1",
      },
      {
        id: "USDA-NRCS",
        label: "Natural Resources Conservation Service",
        value: "USDA-NRCS",
      },
      {
        id: "USDA-FS",
        label: "Forest Service",
        value: "USDA-FS",
      },
      {
        id: "USDA-FSIS",
        label: "Food Safety Inspection Service",
        value: "USDA-FSIS",
      },
      {
        id: "USDA-FSA",
        label: "Farm Service Agency",
        value: "USDA-FSA",
      },
      {
        id: "USDA-NIFA",
        label: "National Institute of Food and Agriculture",
        value: "USDA-NIFA",
      },
      {
        id: "USDA-FAS-TGPA",
        label: "Trade Policy and Geographic Affairs",
        value: "USDA-FAS-TGPA",
      },
      {
        id: "USDA-FAS-TGPA-10960",
        label: "Technical Agricultural Assistance 10.960",
        value: "USDA-FAS-TGPA-10960",
      },
      {
        id: "USDA-FAS-GP",
        label: "Global Programs",
        value: "USDA-FAS-GP",
      },
      {
        id: "USDA-FAS-GP-10961",
        label: "Scientific Cooperation and Research 10.961",
        value: "USDA-FAS-GP-10961",
      },
      {
        id: "USDA-FAS-GP-10960",
        label: "Technical Agricultural Assistance 10.960",
        value: "USDA-FAS-GP-10960",
      },
      {
        id: "USDA-FAS-GP-10962",
        label: "Cochran Fellowship Prog-Intl Trng 10.962",
        value: "USDA-FAS-GP-10962",
      },
      {
        id: "USDA-NRCS-ASO",
        label: "NRCS-Alaska State Office",
        value: "USDA-NRCS-ASO",
      },
      {
        id: "USDA-NRCS-INSO",
        label: "Indiana State Office",
        value: "USDA-NRCS-INSO",
      },
      {
        id: "USDA-NRCS-FLSO",
        label: "Florida State Office",
        value: "USDA-NRCS-FLSO",
      },
      {
        id: "USDA-NRCS-GASO",
        label: "Georgia State Office",
        value: "USDA-NRCS-GASO",
      },
      {
        id: "USDA-NRCS-HISO",
        label: "Hawaii State Office",
        value: "USDA-NRCS-HISO",
      },
      {
        id: "USDA-NRCS-COSO",
        label: "Colorado State Office",
        value: "USDA-NRCS-COSO",
      },
      {
        id: "USDA-NRCS-CTSO",
        label: "NRCS-Connecticut State Office",
        value: "USDA-NRCS-CTSO",
      },
      {
        id: "USDA-NRCS-IDSO",
        label: "Idaho State Office",
        value: "USDA-NRCS-IDSO",
      },
      {
        id: "USDA-NRCS-IASO",
        label: "USDA-NRCS-Iowa State Office",
        value: "USDA-NRCS-IASO",
      },
      {
        id: "USDA-NRCS-FTWO",
        label: "USDA-NRCS-MSD-Ft Worth Office",
        value: "USDA-NRCS-FTWO",
      },
      {
        id: "USDA-NRCS-ARSO",
        label: "NRCS-Arkansas State Office",
        value: "USDA-NRCS-ARSO",
      },
      {
        id: "USDA-NRCS-CSO",
        label: "California State Office",
        value: "USDA-NRCS-CSO",
      },
      {
        id: "USDA-NRCS-ILSO",
        label: "NRCS-Illinois State Office",
        value: "USDA-NRCS-ILSO",
      },
      {
        id: "USDA-NRCS-MSSO",
        label: "Mississippi State Office",
        value: "USDA-NRCS-MSSO",
      },
      {
        id: "USDA-NRCS-MTSO",
        label: "Montana State Office",
        value: "USDA-NRCS-MTSO",
      },
      {
        id: "USDA-NRCS-MASO",
        label: "Massachusetts",
        value: "USDA-NRCS-MASO",
      },
      {
        id: "USDA-NRCS-NJSO",
        label: "New Jersey State Office",
        value: "USDA-NRCS-NJSO",
      },
      {
        id: "USDA-NRCS-NCSO",
        label: "North Carolina State Office",
        value: "USDA-NRCS-NCSO",
      },
      {
        id: "USDA-NRCS-MOSO",
        label: "Missouri State Office",
        value: "USDA-NRCS-MOSO",
      },
      {
        id: "USDA-NRCS-MDSO",
        label: "Maryland State Office",
        value: "USDA-NRCS-MDSO",
      },
      {
        id: "USDA-NRCS-MISO",
        label: "Michigan State Office",
        value: "USDA-NRCS-MISO",
      },
      {
        id: "USDA-NRCS-NMSO",
        label: "New Mexico State Office",
        value: "USDA-NRCS-NMSO",
      },
      {
        id: "USDA-NRCS-NDSO",
        label: "North Dakota State Office",
        value: "USDA-NRCS-NDSO",
      },
      {
        id: "USDA-NRCS-KSSO",
        label: "Kansas State Office",
        value: "USDA-NRCS-KSSO",
      },
      {
        id: "USDA-NRCS-KYSO",
        label: "Kentucky State Office",
        value: "USDA-NRCS-KYSO",
      },
      {
        id: "USDA-NRCS-LASO",
        label: "Louisiana State Office",
        value: "USDA-NRCS-LASO",
      },
      {
        id: "USDA-NRCS-NESO",
        label: "Nebraska State Office",
        value: "USDA-NRCS-NESO",
      },
      {
        id: "USDA-NRCS-MESO",
        label: "NRCS-Maine State Office",
        value: "USDA-NRCS-MESO",
      },
      {
        id: "USDA-NRCS-RISO",
        label: "Rhode Island State Office",
        value: "USDA-NRCS-RISO",
      },
      {
        id: "USDA-NRCS-OHSO",
        label: "Ohio State Office",
        value: "USDA-NRCS-OHSO",
      },
      {
        id: "USDA-NRCS-OKSO",
        label: "USDA-NRCS",
        value: "USDA-NRCS-OKSO",
      },
      {
        id: "USDA-NRCS-ORSO",
        label: "NRCS Oregon",
        value: "USDA-NRCS-ORSO",
      },
      {
        id: "USDA-NRCS-PASO",
        label: "Pennsylvania State Office",
        value: "USDA-NRCS-PASO",
      },
      {
        id: "USDA-NRCS-NYSO",
        label: "New York State Office",
        value: "USDA-NRCS-NYSO",
      },
      {
        id: "USDA-NRCS-NRCSNH",
        label: "USDA NRCS NH State Office",
        value: "USDA-NRCS-NRCSNH",
      },
      {
        id: "USDA-NRCS-SCSO",
        label: "South Carolina State Office",
        value: "USDA-NRCS-SCSO",
      },
      {
        id: "USDA-NRCS-PRSO",
        label: "Puerto Rico State Office",
        value: "USDA-NRCS-PRSO",
      },
      {
        id: "USDA-NRCS-PIASO",
        label: "Pacific Island Area State Office",
        value: "USDA-NRCS-PIASO",
      },
      {
        id: "USDA-NRCS-NRCS",
        label: "USDA-NRCS-NHQ",
        value: "USDA-NRCS-NRCS",
      },
      {
        id: "USDA-NRCS-TXSO",
        label: "Texas State Office",
        value: "USDA-NRCS-TXSO",
      },
      {
        id: "USDA-NRCS-UTSO",
        label: "Utah State Office",
        value: "USDA-NRCS-UTSO",
      },
      {
        id: "USDA-NRCS-VTSO",
        label: "Vermont State Office",
        value: "USDA-NRCS-VTSO",
      },
      {
        id: "USDA-NRCS-WASO",
        label: "Washington State Office",
        value: "USDA-NRCS-WASO",
      },
      {
        id: "USDA-NRCS-SDSO",
        label: "South Dakota State Office",
        value: "USDA-NRCS-SDSO",
      },
      {
        id: "USDA-NRCS-VASO",
        label: "Virginia State Office",
        value: "USDA-NRCS-VASO",
      },
      {
        id: "USDA-NRCS-WYSO",
        label: "NRCS Iowa State Office",
        value: "USDA-NRCS-WYSO",
      },
      {
        id: "USDA-RHS",
        label: "Rural Housing Service",
        value: "USDA-RHS",
      },
      {
        id: "USDA-OPPE",
        label: "Office of Partnerships and Public Engagements",
        value: "USDA-OPPE",
      },
      {
        id: "USDA-RMA",
        label: "Risk Management Agency",
        value: "USDA-RMA",
      },
      {
        id: "USDA-USDAERS",
        label: "Economic Research Service",
        value: "USDA-USDAERS",
      },
      {
        id: "USDA-RMA-RME",
        label: "Risk Management Education",
        value: "USDA-RMA-RME",
      },
    ],
  },
  {
    id: "USDOJ",
    label: "Department of Justice",
    value: "USDOJ",
    children: [
      {
        id: "USDOJ-BOP-NIC",
        label: "National Institute of Corrections",
        value: "USDOJ-BOP-NIC",
      },
      {
        id: "USDOJ-OJP",
        label: "Office of Justice Programs",
        value: "USDOJ-OJP",
      },
      {
        id: "USDOJ-OJP-BJA",
        label: "Bureau of Justice Assistance",
        value: "USDOJ-OJP-BJA",
      },
      {
        id: "USDOJ-COPS",
        label: "Community Oriented Policing Services",
        value: "USDOJ-COPS",
      },
      {
        id: "USDOJ-OJP-CCDO",
        label: "Community Capacity Development Office",
        value: "USDOJ-OJP-CCDO",
      },
      {
        id: "USDOJ-OJP-BJS",
        label: "Bureau of Justice Statistics",
        value: "USDOJ-OJP-BJS",
      },
      {
        id: "USDOJ-OJP-NIJ",
        label: "National Institute of Justice",
        value: "USDOJ-OJP-NIJ",
      },
      {
        id: "USDOJ-OJP-OJJDP",
        label: "Office of Juvenile Justice Delinquency Prevention ",
        value: "USDOJ-OJP-OJJDP",
      },
      {
        id: "USDOJ-OJP-COPS",
        label: "Community Oriented Policing Services",
        value: "USDOJ-OJP-COPS",
      },
      {
        id: "USDOJ-OJP-OVW",
        label: "Office on Violence Against Women",
        value: "USDOJ-OJP-OVW",
      },
      {
        id: "USDOJ-OJP-OVC",
        label: "Office for Victims of Crime",
        value: "USDOJ-OJP-OVC",
      },
      {
        id: "USDOJ-OJP-SMART",
        label: "SMART",
        value: "USDOJ-OJP-SMART",
      },
    ],
  },
  {
    id: "USDOT",
    label: "Department of the Treasury",
    value: "USDOT",
    children: [
      {
        id: "USDOT-IRS",
        label: "Internal Revenue Service",
        value: "USDOT-IRS",
      },
      {
        id: "USDOT-IRS-TCE",
        label: "Tax Counseling for the Elderly ",
        value: "USDOT-IRS-TCE",
      },
      {
        id: "USDOT-IRS-VITA",
        label: "Volunteer Income Tax Assistance",
        value: "USDOT-IRS-VITA",
      },
      {
        id: "USDOT-CDFI",
        label: "Community Development Financial Institutions",
        value: "USDOT-CDFI",
      },
      {
        id: "USDOT-GCR",
        label: "U.S. Dept. of Treasury RESTORE Act Program",
        value: "USDOT-GCR",
      },
      {
        id: "USDOT-DO-SIPPRA",
        label: "SIPPRA",
        value: "USDOT-DO-SIPPRA",
      },
      {
        id: "USDOT-LITC",
        label: "Low Income Taxpayer Clinic ",
        value: "USDOT-LITC",
      },
      {
        id: "USDOT-ORP",
        label: "Office of Capital Access ",
        value: "USDOT-ORP",
      },
    ],
  },
  {
    id: "VA",
    label: "Department of Veterans Affairs",
    value: "VA",
    children: [
      {
        id: "VA-HPGPDP",
        label: "Homeless Providers Grant and Per Diem Program",
        value: "VA-HPGPDP",
      },
      {
        id: "VA-NCA",
        label: "VA National Cemetery Administration",
        value: "VA-NCA",
      },
      {
        id: "VA-CSHF",
        label: "Construction of State Home Facilities",
        value: "VA-CSHF",
      },
      {
        id: "VA-OMH",
        label: "VA Office of Mental Health",
        value: "VA-OMH",
      },
      {
        id: "VA-CBO",
        label: "VHA Member Services-Veterans Transportation ",
        value: "VA-CBO",
      },
      {
        id: "VA-NVSP",
        label: "National Veterans Sports Programs",
        value: "VA-NVSP",
      },
      {
        id: "VA-LGY1",
        label: "VA Loan Guaranty Service",
        value: "VA-LGY1",
      },
      {
        id: "VA-NCAC",
        label: "NCA Contracting",
        value: "VA-NCAC",
      },
      {
        id: "VA-LSV",
        label: "Legal Services for Veterans",
        value: "VA-LSV",
      },
      {
        id: "VA-RVCP",
        label: "Interagency Health Affairs",
        value: "VA-RVCP",
      },
      {
        id: "VA-OMHSP",
        label: "Office of Suicide Prevention",
        value: "VA-OMHSP",
      },
      {
        id: "VA-VEPFS",
        label: "Veterans Employment Pay for Success",
        value: "VA-VEPFS",
      },
      {
        id: "VA-VLGP",
        label: "Veterans Legacy Grants Program",
        value: "VA-VLGP",
      },
      {
        id: "VA-OTED",
        label: "Veterans Benefit Administration",
        value: "VA-OTED",
      },
      {
        id: "VA-OMHSP-CBISP",
        label: "Community Based Interventions",
        value: "VA-OMHSP-CBISP",
      },
      {
        id: "VA-SSVF",
        label: "Supportive Services for Veteran Families",
        value: "VA-SSVF",
      },
    ],
  },
];
