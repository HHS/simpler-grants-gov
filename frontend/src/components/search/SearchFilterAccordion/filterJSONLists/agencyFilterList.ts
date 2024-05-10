import { FilterOption } from "../SearchFilterAccordion";

export const agencyFilterList: FilterOption[] = [
  {
    id: "ARPAH",
    label: "Advanced Research Projects Agency for Health (ARPAH)",
    value: "ARPAH",
  },
  {
    id: "USAID",
    label: "Agency for International Development (USAID)",
    value: "USAID",
    children: [
      {
        id: "USAID-AFG",
        label: "Afghanistan USAID-Kabul (USAID-AFG)",
        value: "USAID-AFG",
      },
      {
        id: "USAID",
        label: "Agency for International Development (USAID)",
        value: "USAID",
      },
      {
        id: "USAID-ARM",
        label: "Armenia USAID-Yerevan (USAID-ARM)",
        value: "USAID-ARM",
      },
      {
        id: "USAID-AZE",
        label: "Azerbaijan USAID-Baku (USAID-AZE)",
        value: "USAID-AZE",
      },
      {
        id: "USAID-BAN",
        label: "Bangladesh USAID-Dhaka (USAID-BAN)",
        value: "USAID-BAN",
      },
      {
        id: "USAID-BEN",
        label: "Benin USAID-Cotonou (USAID-BEN)",
        value: "USAID-BEN",
      },
    ],
  },
  {
    id: "AC",
    label: "AmeriCorps (AC)",
    value: "AC",
  },
  {
    id: "DC",
    label: "Denali Commission (DC)",
    value: "DC",
  },
  {
    id: "USDA",
    label: "Department of Agriculture (USDA)",
    value: "USDA",
    children: [
      {
        id: "USDA-AMS",
        label: "Agricultural Marketing Service (USDA-AMS)",
        value: "USDA-AMS",
      },
      {
        id: "USDA-FNS1",
        label: "Food and Nutrition Service (USDA-FNS1)",
        value: "USDA-FNS1",
      },
    ],
  },
  {
    id: "DOC",
    label: "Department of Commerce (DOC)",
    value: "DOC",
    children: [
      {
        id: "DOC-DOCNOAAERA",
        label: "DOC NOAA - ERA Production (DOC-DOCNOAAERA)",
        value: "DOC-DOCNOAAERA",
      },
      {
        id: "DOC-EDA",
        label: "Economic Development Administration (DOC-EDA)",
        value: "DOC-EDA",
      },
      {
        id: "DOC-NIST",
        label: "National Institute of Standards and Technology (DOC-NIST)",
        value: "DOC-NIST",
      },
    ],
  },
  {
    id: "DOD",
    label: "Department of Defense (DOD)",
    value: "DOD",
    children: [
      {
        id: "DOD-AMC-ACCAPGN",
        label: "ACC APG - Natick (DOD-AMC-ACCAPGN)",
        value: "DOD-AMC-ACCAPGN",
      },
      {
        id: "DOD-AMC-ACCAPGD",
        label: "ACC-APG-Detrick (DOD-AMC-ACCAPGD)",
        value: "DOD-AMC-ACCAPGD",
      },
      {
        id: "DOD-AFRL-AFRLDET8",
        label: "AFRL Kirtland AFB (DOD-AFRL-AFRLDET8)",
        value: "DOD-AFRL-AFRLDET8",
      },
      {
        id: "DOD-AFRL",
        label: "Air Force -- Research Lab (DOD-AFRL)",
        value: "DOD-AFRL",
      },
      {
        id: "DOD-USAFA",
        label: "Air Force Academy (DOD-USAFA)",
        value: "DOD-USAFA",
      },
      {
        id: "DOD-AFOSR",
        label: "Air Force Office of Scientific Research (DOD-AFOSR)",
        value: "DOD-AFOSR",
      },
      {
        id: "DOD-DARPA-BTO",
        label: "DARPA - Biological Technologies Office (DOD-DARPA-BTO)",
        value: "DOD-DARPA-BTO",
      },
    ],
  },
  {
    id: "ED",
    label: "Department of Education (ED)",
    value: "ED",
  },
  {
    id: "DOE",
    label: "Department of Energy (DOE)",
    value: "DOE",
    children: [
      {
        id: "DOE-ARPAE",
        label: "Advanced Research Projects Agency Energy (DOE-ARPAE)",
        value: "DOE-ARPAE",
      },
      {
        id: "DOE-GFO",
        label: "Golden Field Office (DOE-GFO)",
        value: "DOE-GFO",
      },
      {
        id: "DOE-01",
        label: "Headquarters (DOE-01)",
        value: "DOE-01",
      },
    ],
  },
  {
    id: "PAMS",
    label: "Department of Energy - Office of Science (PAMS)",
    value: "PAMS",
    children: [
      {
        id: "PAMS-SC",
        label: "Office of Science (PAMS-SC)",
        value: "PAMS-SC",
      },
    ],
  },
  {
    id: "HHS",
    label: "Department of Health and Human Services (HHS)",
    value: "HHS",
    children: [
      {
        id: "HHS-ACF-FYSB",
        label:
          "Administration for Children & Families - ACYF/FYSB (HHS-ACF-FYSB)",
        value: "HHS-ACF-FYSB",
      },
      {
        id: "HHS-ACF",
        label: "Administration for Children and Families (HHS-ACF)",
        value: "HHS-ACF",
      },
      {
        id: "HHS-ACF-CB",
        label:
          "Administration for Children and Families - ACYF/CB (HHS-ACF-CB)",
        value: "HHS-ACF-CB",
      },
    ],
  },
  {
    id: "DHS",
    label: "Department of Homeland Security (DHS)",
    value: "DHS",
    children: [
      {
        id: "DHS-DHS",
        label: "Department of Homeland Security - FEMA (DHS-DHS)",
        value: "DHS-DHS",
      },
      {
        id: "DHS-OPO",
        label: "Office of Procurement Operations - Grants Division (DHS-OPO)",
        value: "DHS-OPO",
      },
      {
        id: "DHS-USCG",
        label: "United States Coast Guard (DHS-USCG)",
        value: "DHS-USCG",
      },
    ],
  },
  {
    id: "HUD",
    label: "Department of Housing and Urban Development (HUD)",
    value: "HUD",
  },
  {
    id: "USDOJ",
    label: "Department of Justice (USDOJ)",
    value: "USDOJ",
    children: [
      {
        id: "USDOJ-OJP-BJA",
        label: "Bureau of Justice Assistance (USDOJ-OJP-BJA)",
        value: "USDOJ-OJP-BJA",
      },
      {
        id: "USDOJ-OJP-COPS",
        label: "Community Oriented Policing Services (USDOJ-OJP-COPS)",
        value: "USDOJ-OJP-COPS",
      },
    ],
  },
  {
    id: "DOL",
    label: "Department of Labor (DOL)",
    value: "DOL",
    children: [
      {
        id: "DOL-ETA-ILAB",
        label: "Bureau of International Labor Affairs (DOL-ETA-ILAB)",
        value: "DOL-ETA-ILAB",
      },
      {
        id: "DOL-ETA-CEO",
        label: "Chief Evaluation Office (DOL-ETA-CEO)",
        value: "DOL-ETA-CEO",
      },
    ],
  },
  {
    id: "DOS",
    label: "Department of State (DOS)",
    value: "DOS",
    children: [
      {
        id: "DOS-NEA-AC",
        label: "Assistance Coordination (DOS-NEA-AC)",
        value: "DOS-NEA-AC",
      },
      {
        id: "DOS-DRL",
        label: "Bureau of Democracy Human Rights and Labor (DOS-DRL)",
        value: "DOS-DRL",
      },
      {
        id: "DOS-ECA",
        label: "Bureau Of Educational and Cultural Affairs (DOS-ECA)",
        value: "DOS-ECA",
      },
    ],
  },
  {
    id: "DOI",
    label: "Department of the Interior (DOI)",
    value: "DOI",
    children: [
      {
        id: "DOI-BIA",
        label: "Bureau of Indian Affairs (DOI-BIA)",
        value: "DOI-BIA",
      },
      {
        id: "DOI-BLM",
        label: "Bureau of Land Management (DOI-BLM)",
        value: "DOI-BLM",
      },
      {
        id: "DOI-BOR",
        label: "Bureau of Reclamation (DOI-BOR)",
        value: "DOI-BOR",
      },
    ],
  },
  {
    id: "USDOT",
    label: "Department of the Treasury (USDOT)",
    value: "USDOT",
    children: [
      {
        id: "USDOT-ORP",
        label: "Office of Capital Access (USDOT-ORP)",
        value: "USDOT-ORP",
      },
      {
        id: "USDOT-DO-SIPPRA",
        label: "SIPPRA (USDOT-DO-SIPPRA)",
        value: "USDOT-DO-SIPPRA",
      },
      {
        id: "USDOT-GCR",
        label: "U.S. Dept. of Treasury RESTORE Act Program (USDOT-GCR)",
        value: "USDOT-GCR",
      },
    ],
  },
  {
    id: "DOT",
    label: "Department of Transportation (DOT)",
    value: "DOT",
    children: [
      {
        id: "DOT-DOT X-50",
        label: "69A345 Office of the Under Secretary for Policy (DOT-DOT X-50)",
        value: "DOT-DOT X-50",
      },
      {
        id: "DOT-RITA",
        label: "69A355 Research and Technology (DOT-RITA)",
        value: "DOT-RITA",
      },
      {
        id: "DOT-FAA-FAA ARG",
        label: "DOT - FAA Aviation Research Grants (DOT-FAA-FAA ARG)",
        value: "DOT-FAA-FAA ARG",
      },
      {
        id: "DOT-FRA",
        label: "DOT - Federal Railroad Administration (DOT-FRA)",
        value: "DOT-FRA",
      },
      {
        id: "DOT-FHWA",
        label: "DOT Federal Highway Administration (DOT-FHWA)",
        value: "DOT-FHWA",
      },
      {
        id: "DOT-FTA",
        label: "DOT/Federal Transit Administration (DOT-FTA)",
        value: "DOT-FTA",
      },
      {
        id: "DOT-FAA-FAA COE-AJFE",
        label: "FAA-COE-AJFE (DOT-FAA-FAA COE-AJFE)",
        value: "DOT-FAA-FAA COE-AJFE",
      },
      {
        id: "DOT-FAA-FAA COE-FAA JAMS",
        label: "FAA-COE-JAMS (DOT-FAA-FAA COE-FAA JAMS)",
        value: "DOT-FAA-FAA COE-FAA JAMS",
      },
      {
        id: "DOT-FAA-FAA COE-TTHP",
        label: "FAA-COE-TTHP (DOT-FAA-FAA COE-TTHP)",
        value: "DOT-FAA-FAA COE-TTHP",
      },
      {
        id: "DOT-MA",
        label: "Maritime Administration (DOT-MA)",
        value: "DOT-MA",
      },
      {
        id: "DOT-NHTSA",
        label: "National Highway Traffic Safety Administration (DOT-NHTSA)",
        value: "DOT-NHTSA",
      },
    ],
  },
  {
    id: "VA",
    label: "Department of Veterans Affairs (VA)",
    value: "VA",
    children: [
      {
        id: "VA-CSHF",
        label: "Construction of State Home Facilities (VA-CSHF)",
        value: "VA-CSHF",
      },
      {
        id: "VA-HPGPDP",
        label: "Homeless Providers Grant and Per Diem Program (VA-HPGPDP)",
        value: "VA-HPGPDP",
      },
      {
        id: "VA-LSV",
        label: "Legal Services for Veterans (VA-LSV)",
        value: "VA-LSV",
      },
      {
        id: "VA-NVSP",
        label: "National Veterans Sports Programs (VA-NVSP)",
        value: "VA-NVSP",
      },
      {
        id: "VA-NCAC",
        label: "NCA Contracting (VA-NCAC)",
        value: "VA-NCAC",
      },
      {
        id: "VA-OMHSP",
        label: "Office of Mental Health and Suicide Prevention (VA-OMHSP)",
        value: "VA-OMHSP",
      },
      {
        id: "VA-SSVF",
        label: "Supportive Services for Veteran Families (VA-SSVF)",
        value: "VA-SSVF",
      },
      {
        id: "VA-NCA",
        label: "VA National Cemetery Administration (VA-NCA)",
        value: "VA-NCA",
      },
      {
        id: "VA-VLGP",
        label: "Veterans Legacy Grants Program (VA-VLGP)",
        value: "VA-VLGP",
      },
    ],
  },
  {
    id: "EPA",
    label: "Environmental Protection Agency (EPA)",
    value: "EPA",
  },
  {
    id: "IMLS",
    label: "Institute of Museum and Library Services (IMLS)",
    value: "IMLS",
  },
  {
    id: "MCC",
    label: "Millennium Challenge Corporation (MCC)",
    value: "MCC",
  },
  {
    id: "NASA",
    label: "National Aeronautics and Space Administration (NASA)",
    value: "NASA",
    children: [
      {
        id: "NASA-HQ",
        label: "NASA Headquarters (NASA-HQ)",
        value: "NASA-HQ",
      },
      {
        id: "NASA-JSC",
        label: "NASA Johnson Space Center (NASA-JSC)",
        value: "NASA-JSC",
      },
      {
        id: "NASA-SFC",
        label: "NASA Marshall Space Flight Center (NASA-SFC)",
        value: "NASA-SFC",
      },
      {
        id: "NASA",
        label: "National Aeronautics and Space Administration (NASA)",
        value: "NASA",
      },
    ],
  },
  {
    id: "NARA",
    label: "National Archives and Records Administration (NARA)",
    value: "NARA",
  },
  {
    id: "NEA",
    label: "National Endowment for the Arts (NEA)",
    value: "NEA",
  },
  {
    id: "NEH",
    label: "National Endowment for the Humanities (NEH)",
    value: "NEH",
  },
  {
    id: "NSF",
    label: "National Science Foundation (NSF)",
    value: "NSF",
  },
  {
    id: "SSA",
    label: "Social Security Administration (SSA)",
    value: "SSA",
  },
];
