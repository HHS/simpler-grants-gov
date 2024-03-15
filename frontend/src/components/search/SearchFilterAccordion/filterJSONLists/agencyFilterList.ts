import { FilterOption } from "../SearchFilterAccordion";

export const agencyFilterList: FilterOption[] = [
  {
    id: "ARPAH",
    label: "All Advanced Research Projects Agency for Health [ARPAH]",
    value: "ARPAH",
  },
  {
    id: "USAID",
    label: "All Agency for International Development [USAID]",
    value: "USAID",
    children: [
      {
        id: "USAID-AFG",
        label: "Afghanistan USAID-Kabul [USAID-AFG]",
        value: "USAID-AFG",
      },
      {
        id: "USAID",
        label: "Agency for International Development [USAID]",
        value: "USAID",
      },
      {
        id: "USAID-ARM",
        label: "Armenia USAID-Yerevan [USAID-ARM]",
        value: "USAID-ARM",
      },
      //       {
      //         id: "USAID-AZE",
      //         label: "Azerbaijan USAID-Baku [USAID-AZE]",
      //         value: "USAID-AZE",
      //       },
      //       {
      //         id: "USAID-BAN",
      //         label: "Bangladesh USAID-Dhaka [USAID-BAN]",
      //         value: "USAID-BAN",
      //       },
      //       {
      //         id: "USAID-BEN",
      //         label: "Benin USAID-Cotonou [USAID-BEN]",
      //         value: "USAID-BEN",
      //       },
      //       {
      //         id: "USAID-BMA",
      //         label: "Burma USAID - Rangoon [USAID-BMA]",
      //         value: "USAID-BMA",
      //       },
      //       {
      //         id: "USAID-BUR",
      //         label: "Burundi USAID-Bujumbura [USAID-BUR]",
      //         value: "USAID-BUR",
      //       },
      //       {
      //         id: "USAID-CAM",
      //         label: "Cambodia USAID-Phnom Penh [USAID-CAM]",
      //         value: "USAID-CAM",
      //       },
      //       {
      //         id: "USAID-COL",
      //         label: "Colombia USAID-Bogota [USAID-COL]",
      //         value: "USAID-COL",
      //       },
      //       {
      //         id: "USAID-DEM",
      //         label: "Democratic Republic of the Congo USAID-Kinshasa [USAID-DEM]",
      //         value: "USAID-DEM",
      //       },
      //       {
      //         id: "USAID-DOM",
      //         label: "Dominican Republic USAID-Santo Domingo [USAID-DOM]",
      //         value: "USAID-DOM",
      //       },
      //       {
      //         id: "USAID-EAF",
      //         label: "East Africa USAID-Kenya [USAID-EAF]",
      //         value: "USAID-EAF",
      //       },
      //       {
      //         id: "USAID-EGY",
      //         label: "Egypt USAID-Cairo [USAID-EGY]",
      //         value: "USAID-EGY",
      //       },
      //       {
      //         id: "USAID-ELS",
      //         label: "El Salvador USAID-San Salvador [USAID-ELS]",
      //         value: "USAID-ELS",
      //       },
      //       {
      //         id: "USAID-ETH",
      //         label: "Ethiopia USAID-Addis Ababa [USAID-ETH]",
      //         value: "USAID-ETH",
      //       },
      //       {
      //         id: "USAID-GEO",
      //         label: "Georgia USAID-Tbilisi [USAID-GEO]",
      //         value: "USAID-GEO",
      //       },
      //       {
      //         id: "USAID-GER",
      //         label: "Germany USAID - Frankfurt [USAID-GER]",
      //         value: "USAID-GER",
      //       },
      //       {
      //         id: "USAID-GHA",
      //         label: "Ghana USAID-Accra [USAID-GHA]",
      //         value: "USAID-GHA",
      //       },
      //       {
      //         id: "USAID-GUA",
      //         label: "Guatemala USAID-Guatemala City [USAID-GUA]",
      //         value: "USAID-GUA",
      //       },
      //       {
      //         id: "USAID-GUI",
      //         label: "Guinea USAID-Conakry [USAID-GUI]",
      //         value: "USAID-GUI",
      //       },
      //       {
      //         id: "USAID-HAI",
      //         label: "Haiti USAID-Port Au Prince [USAID-HAI]",
      //         value: "USAID-HAI",
      //       },
      //       {
      //         id: "USAID-HON",
      //         label: "Honduras USAID-Tegucigalpa [USAID-HON]",
      //         value: "USAID-HON",
      //       },
      //       {
      //         id: "USAID-INA",
      //         label: "India USAID-New Delhi [USAID-INA]",
      //         value: "USAID-INA",
      //       },
      //       {
      //         id: "USAID-IND",
      //         label: "Indonesia USAID-Jakarta [USAID-IND]",
      //         value: "USAID-IND",
      //       },
      //       {
      //         id: "USAID-IRA",
      //         label: "Iraq USAID-Baghdad [USAID-IRA]",
      //         value: "USAID-IRA",
      //       },
      //       {
      //         id: "USAID-JOR",
      //         label: "Jordan USAID-Amman [USAID-JOR]",
      //         value: "USAID-JOR",
      //       },
      //       {
      //         id: "USAID-KAZ",
      //         label: "Kazakhstan USAID-Almaty [USAID-KAZ]",
      //         value: "USAID-KAZ",
      //       },
      //       {
      //         id: "USAID-KEN",
      //         label: "Kenya USAID-Nairobi [USAID-KEN]",
      //         value: "USAID-KEN",
      //       },
      //       {
      //         id: "USAID-KOS",
      //         label: "Kosovo USAID-Pristina [USAID-KOS]",
      //         value: "USAID-KOS",
      //       },
      //       {
      //         id: "USAID-LIB",
      //         label: "Liberia USAID-Monrovia [USAID-LIB]",
      //         value: "USAID-LIB",
      //       },
      //       {
      //         id: "USAID-MAC",
      //         label: "Macedonia USAID-Skopje [USAID-MAC]",
      //         value: "USAID-MAC",
      //       },
      //       {
      //         id: "USAID-MLW",
      //         label: "Malawi USAID-Lilongwe [USAID-MLW]",
      //         value: "USAID-MLW",
      //       },
      //       {
      //         id: "USAID-MAL",
      //         label: "Mali USAID -Bamako [USAID-MAL]",
      //         value: "USAID-MAL",
      //       },
      //       {
      //         id: "USAID-MEX",
      //         label: "Mexico USAID-Mexico City [USAID-MEX]",
      //         value: "USAID-MEX",
      //       },
      //       {
      //         id: "USAID-MERP",
      //         label: "Middle East Regional Platform USAID-MERP [USAID-MERP]",
      //         value: "USAID-MERP",
      //       },
      //       {
      //         id: "USAID-MOR",
      //         label: "Morocco USAID-Rabat [USAID-MOR]",
      //         value: "USAID-MOR",
      //       },
      //       {
      //         id: "USAID-MOZ",
      //         label: "Mozambique USAID-Maputo [USAID-MOZ]",
      //         value: "USAID-MOZ",
      //       },
      //       {
      //         id: "USAID-NEP",
      //         label: "Nepal USAID-Kathmandu [USAID-NEP]",
      //         value: "USAID-NEP",
      //       },
      //       {
      //         id: "USAID-NIG",
      //         label: "Nigeria USAID-Abuja [USAID-NIG]",
      //         value: "USAID-NIG",
      //       },
      //       {
      //         id: "USAID-PAK",
      //         label: "Pakistan USAID-Islamabad [USAID-PAK]",
      //         value: "USAID-PAK",
      //       },
      //       {
      //         id: "USAID-PAR",
      //         label: "Paraguay USAID-Asuncion [USAID-PAR]",
      //         value: "USAID-PAR",
      //       },
      //       {
      //         id: "USAID-PER",
      //         label: "Peru USAID-Lima [USAID-PER]",
      //         value: "USAID-PER",
      //       },
      //       {
      //         id: "USAID-PHI",
      //         label: "Philippines USAID-Manila [USAID-PHI]",
      //         value: "USAID-PHI",
      //       },
      //       {
      //         id: "USAID-RWA",
      //         label: "Rwanda USAID-Kigali [USAID-RWA]",
      //         value: "USAID-RWA",
      //       },
      //       {
      //         id: "USAID-SEN",
      //         label: "Senegal USAID-Dakar [USAID-SEN]",
      //         value: "USAID-SEN",
      //       },
      //       {
      //         id: "USAID-SER",
      //         label: "Serbia USAID-Belgrade [USAID-SER]",
      //         value: "USAID-SER",
      //       },
      //       {
      //         id: "USAID-SAF",
      //         label: "South Africa USAID-Pretoria [USAID-SAF]",
      //         value: "USAID-SAF",
      //       },
      //       {
      //         id: "USAID-SSD",
      //         label: "South Sudan (USAID)-Juba [USAID-SSD]",
      //         value: "USAID-SSD",
      //       },
      //       {
      //         id: "USAID-SRI",
      //         label: "Sri Lanka USAID-Colombo [USAID-SRI]",
      //         value: "USAID-SRI",
      //       },
      //       {
      //         id: "USAID-SUD",
      //         label: "Sudan USAID-Khartoum [USAID-SUD]",
      //         value: "USAID-SUD",
      //       },
      //       {
      //         id: "USAID-TAN",
      //         label: "Tanzania USAID-Dar es Salaam [USAID-TAN]",
      //         value: "USAID-TAN",
      //       },
      //       {
      //         id: "USAID-THA",
      //         label: "Thailand USAID-Bangkok [USAID-THA]",
      //         value: "USAID-THA",
      //       },
      //       {
      //         id: "USAID-UGA",
      //         label: "Uganda USAID-Kampala [USAID-UGA]",
      //         value: "USAID-UGA",
      //       },
      //       {
      //         id: "USAID-UKR",
      //         label: "Ukraine USAID-Kiev [USAID-UKR]",
      //         value: "USAID-UKR",
      //       },
      //       {
      //         id: "USAID-BAR",
      //         label: "USAID - Barbados and Eastern Caribbean [USAID-BAR]",
      //         value: "USAID-BAR",
      //       },
      //       {
      //         id: "USAID-VIE",
      //         label: "USAID-VIETNAM [USAID-VIE]",
      //         value: "USAID-VIE",
      //       },
      //       {
      //         id: "USAID-WAF",
      //         label: "West Africa USAID-Ghana [USAID-WAF]",
      //         value: "USAID-WAF",
      //       },
      //       {
      //         id: "USAID-WES",
      //         label: "West Bank, Gaza USAID-West Bank [USAID-WES]",
      //         value: "USAID-WES",
      //       },
      //       {
      //         id: "USAID-YEM",
      //         label: "Yemen USAID-Sanaa [USAID-YEM]",
      //         value: "USAID-YEM",
      //       },
      //       {
      //         id: "USAID-ZAM",
      //         label: "Zambia USAID-Lusaka [USAID-ZAM]",
      //         value: "USAID-ZAM",
      //       },
      //       {
      //         id: "USAID-ZIM",
      //         label: "Zimbabwe USAID-Harare [USAID-ZIM]",
      //         value: "USAID-ZIM",
      //       },
      //     ],
      //   },
      //   {
      //     id: "AC",
      //     label: "All AmeriCorps [AC]",
      //     value: "AC",
      //   },
      //   {
      //     id: "DC",
      //     label: "All Denali Commission [DC]",
      //     value: "DC",
      //   },
      //   {
      //     id: "USDA",
      //     label: "All Department of Agriculture [USDA]",
      //     value: "USDA",
      //     children: [
      //       {
      //         id: "USDA-AMS",
      //         label: "Agricultural Marketing Service [USDA-AMS]",
      //         value: "USDA-AMS",
      //       },
      //       {
      //         id: "USDA-FNS1",
      //         label: "Food and Nutrition Service [USDA-FNS1]",
      //         value: "USDA-FNS1",
      //       },
      //       {
      //         id: "USDA-FAS",
      //         label: "Foreign Agricultural Service [USDA-FAS]",
      //         value: "USDA-FAS",
      //       },
      //       { id: "USDA-FS", label: "Forest Service [USDA-FS]", value: "USDA-FS" },
      //       {
      //         id: "USDA-NIFA",
      //         label: "National Institute of Food and Agriculture [USDA-NIFA]",
      //         value: "USDA-NIFA",
      //       },
      //       {
      //         id: "USDA-NRCS",
      //         label: "Natural Resources Conservation Service [USDA-NRCS]",
      //         value: "USDA-NRCS",
      //       },
      //       {
      //         id: "USDA-RMA",
      //         label: "Risk Management Agency [USDA-RMA]",
      //         value: "USDA-RMA",
      //       },
      //       {
      //         id: "USDA-RBCS",
      //         label: "Rural Business-Cooperative Service [USDA-RBCS]",
      //         value: "USDA-RBCS",
      //       },
      //       {
      //         id: "USDA-RHS",
      //         label: "Rural Housing Service [USDA-RHS]",
      //         value: "USDA-RHS",
      //       },
      //       {
      //         id: "USDA-RUS",
      //         label: "Rural Utilities Service [USDA-RUS]",
      //         value: "USDA-RUS",
      //       },
    ],
  },
  {
    id: "DOC",
    label: "All Department of Commerce [DOC]",
    value: "DOC",
    children: [
      { id: "DOC", label: "Department of Commerce [DOC]", value: "DOC" },
      {
        id: "DOC-DOCNOAAERA",
        label: "DOC NOAA - ERA Production [DOC-DOCNOAAERA]",
        value: "DOC-DOCNOAAERA",
      },
      {
        id: "DOC-EDA",
        label: "Economic Development Administration [DOC-EDA]",
        value: "DOC-EDA",
      },
      {
        id: "DOC-NIST",
        label: "National Institute of Standards and Technology [DOC-NIST]",
        value: "DOC-NIST",
      },
    ],
  },
];
