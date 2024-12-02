# Called by seed_local_db when running `make seed-db-local`
from src.db.models.agency_models import Agency
import logging

logger = logging.getLogger(__name__)


# Agencies we want to create locally - note that these are a subset of popular
# agencies from production
AGENCIES_TO_CREATE = [
    {
        "agency_id": 2,
        "agency_code": "ARPAH",
        "agency_name": "Advanced Research Projects Agency for Health",
    },
    {"agency_id": 3, "agency_code": "DOC", "agency_name": "Department of Commerce"},
    {"agency_id": 53, "agency_code": "DOD", "agency_name": "Department of Defense"},
    {"agency_id": 140, "agency_code": "DOE", "agency_name": "Department of Energy"},
    {"agency_id": 156, "agency_code": "DOI", "agency_name": "Department of the Interior"},
    {"agency_id": 504, "agency_code": "EPA", "agency_name": "Environmental Protection Agency"},
    {
        "agency_id": 674,
        "agency_code": "HHS",
        "agency_name": "Department of Health and Human Services",
    },
    {"agency_id": 864, "agency_code": "NSF", "agency_name": "National Science Foundation"},
    {"agency_id": 1, "agency_code": "USAID", "agency_name": "Agency for International Development"},
    {"agency_id": 983, "agency_code": "USDA", "agency_name": "Department of Agriculture"},
    {"agency_id": 1105, "agency_code": "USDOJ", "agency_name": "Department of Justice"},
    {
        "agency_id": 4,
        "agency_code": "DOC-EDA",
        "agency_name": "Economic Development Administration",
        "top_level_agency_id": 3,
    },
    {
        "agency_id": 34,
        "agency_code": "DOC-DOCNOAAERA",
        "agency_name": "DOC NOAA - ERA Production",
        "top_level_agency_id": 3,
    },
    {
        "agency_id": 40,
        "agency_code": "DOC-NIST",
        "agency_name": "National Institute of Standards and Technology",
        "top_level_agency_id": 3,
    },
    {
        "agency_id": 46,
        "agency_code": "DOD-AFOSR",
        "agency_name": "Air Force Office of Scientific Research",
        "top_level_agency_id": 53,
    },
    {
        "agency_id": 54,
        "agency_code": "DOD-AFRL",
        "agency_name": "Air Force -- Research Lab",
        "top_level_agency_id": 53,
    },
    {
        "agency_id": 55,
        "agency_code": "DOD-AMC",
        "agency_name": "Dept of the Army -- Materiel Command",
        "top_level_agency_id": 53,
    },
    {
        "agency_id": 73,
        "agency_code": "DOD-AMRAA",
        "agency_name": "Dept. of the Army -- USAMRAA",
        "top_level_agency_id": 53,
    },
    {
        "agency_id": 74,
        "agency_code": "DOD-COE",
        "agency_name": "Dept. of the Army  --  Corps of Engineers",
        "top_level_agency_id": 53,
    },
    {
        "agency_id": 75,
        "agency_code": "DOD-COE-ERDC",
        "agency_name": "Engineer Research and Development Center",
        "top_level_agency_id": 53,
    },
    {
        "agency_id": 81,
        "agency_code": "DOD-COE-FW",
        "agency_name": "Fort Worth District",
        "top_level_agency_id": 53,
    },
    {
        "agency_id": 89,
        "agency_code": "DOD-DARPA-MTO",
        "agency_name": "DARPA - Microsystems Technology Office ",
        "top_level_agency_id": 53,
    },
    {
        "agency_id": 97,
        "agency_code": "DOD-DARPA-DSO",
        "agency_name": "DARPA - Defense Sciences Office",
        "top_level_agency_id": 53,
    },
    {
        "agency_id": 110,
        "agency_code": "DOD-ONR",
        "agency_name": "Office of Naval Research",
        "top_level_agency_id": 53,
    },
    {
        "agency_id": 113,
        "agency_code": "DOD-ONR-FAC",
        "agency_name": "NAVAL FACILITIES ENGINEERING COMMAND",
        "top_level_agency_id": 53,
    },
    {
        "agency_id": 138,
        "agency_code": "DOE-GFO",
        "agency_name": "Golden Field Office",
        "top_level_agency_id": 140,
    },
    {
        "agency_id": 139,
        "agency_code": "DOE-NETL",
        "agency_name": "National Energy Technology Laboratory",
        "top_level_agency_id": 140,
    },
    {
        "agency_id": 144,
        "agency_code": "DOI-BOR",
        "agency_name": "Bureau of Reclamation",
        "top_level_agency_id": 156,
    },
    {
        "agency_id": 150,
        "agency_code": "DOE-ARPAE",
        "agency_name": "Advanced Research Projects Agency Energy ",
        "top_level_agency_id": 140,
    },
    {
        "agency_id": 158,
        "agency_code": "DOI-BLM",
        "agency_name": "Bureau of Land Management",
        "top_level_agency_id": 156,
    },
    {
        "agency_id": 167,
        "agency_code": "DOI-BOR-LC",
        "agency_name": "Bureau of Reclamation - Lower Colorado Region",
        "top_level_agency_id": 156,
    },
    {
        "agency_id": 169,
        "agency_code": "DOI-BIA",
        "agency_name": "Bureau of Indian Affairs",
        "top_level_agency_id": 156,
    },
    {
        "agency_id": 170,
        "agency_code": "DOI-BOR-MP",
        "agency_name": "Bureau of Reclamation - Mid-Pacific Region",
        "top_level_agency_id": 156,
    },
    {
        "agency_id": 172,
        "agency_code": "DOI-BOEM",
        "agency_name": "Bureau of Ocean Energy Management",
        "top_level_agency_id": 156,
    },
    {
        "agency_id": 174,
        "agency_code": "DOI-FWS",
        "agency_name": "Fish and Wildlife Service",
        "top_level_agency_id": 156,
    },
    {
        "agency_id": 191,
        "agency_code": "DOI-NPS",
        "agency_name": "National Park Service",
        "top_level_agency_id": 156,
    },
    {
        "agency_id": 209,
        "agency_code": "DOI-USGS1",
        "agency_name": "Geological Survey",
        "top_level_agency_id": 156,
    },
    {
        "agency_id": 657,
        "agency_code": "HHS-ACF",
        "agency_name": "Administration for Children and Families",
        "top_level_agency_id": 674,
    },
    {
        "agency_id": 675,
        "agency_code": "HHS-AHRQ",
        "agency_name": "Agency for Health Care Research and Quality",
        "top_level_agency_id": 674,
    },
    {
        "agency_id": 677,
        "agency_code": "HHS-ACF-OPRE",
        "agency_name": "Administration for Children and Families - OPRE",
        "top_level_agency_id": 674,
    },
    {
        "agency_id": 679,
        "agency_code": "HHS-ACF-FYSB",
        "agency_name": "Administration for Children & Families - ACYF/FYSB",
        "top_level_agency_id": 674,
    },
    {
        "agency_id": 681,
        "agency_code": "HHS-ACL",
        "agency_name": "Administration for Community Living",
        "top_level_agency_id": 674,
    },
    {
        "agency_id": 684,
        "agency_code": "HHS-ACF-OHS",
        "agency_name": "Administration for Children and Families - OHS",
        "top_level_agency_id": 674,
    },
    {
        "agency_id": 690,
        "agency_code": "HHS-AOA",
        "agency_name": "Administration on Aging",
        "top_level_agency_id": 674,
    },
    {
        "agency_id": 691,
        "agency_code": "HHS-CDC",
        "agency_name": "Centers for Disease Control and Prevention",
        "top_level_agency_id": 674,
    },
    {
        "agency_id": 692,
        "agency_code": "HHS-CDC-HHSCDCERA",
        "agency_name": "Centers for Disease Control and Prevention - ERA",
        "top_level_agency_id": 674,
    },
    {
        "agency_id": 693,
        "agency_code": "HHS-CDC-NCCDPHP",
        "agency_name": "Centers for Disease Control - NCCDPHP",
        "top_level_agency_id": 674,
    },
    {
        "agency_id": 696,
        "agency_code": "HHS-CDC-CGH",
        "agency_name": "Centers for Disease Control - CGH",
        "top_level_agency_id": 674,
    },
    {
        "agency_id": 707,
        "agency_code": "HHS-CMS",
        "agency_name": "Centers for Medicare & Medicaid Services",
        "top_level_agency_id": 674,
    },
    {
        "agency_id": 708,
        "agency_code": "HHS-FDA",
        "agency_name": "Food and Drug Administration",
        "top_level_agency_id": 674,
    },
    {
        "agency_id": 711,
        "agency_code": "HHS-CDC-NCHHSTP",
        "agency_name": "Centers for Disease Control - NCHHSTP",
        "top_level_agency_id": 674,
    },
    {
        "agency_id": 725,
        "agency_code": "HHS-OPHS",
        "agency_name": "Office of the Assistant Secretary for Health",
        "top_level_agency_id": 674,
    },
    {
        "agency_id": 726,
        "agency_code": "HHS-HRSA",
        "agency_name": "Health Resources and Services Administration",
        "top_level_agency_id": 674,
    },
    {
        "agency_id": 727,
        "agency_code": "HHS-NIH11",
        "agency_name": "National Institutes of Health",
        "top_level_agency_id": 674,
    },
    {
        "agency_id": 728,
        "agency_code": "HHS-IHS",
        "agency_name": "Indian Health Service",
        "top_level_agency_id": 674,
    },
    {
        "agency_id": 742,
        "agency_code": "HHS-SAMHS",
        "agency_name": "Substance Abuse and Mental Health Services Admin",
        "top_level_agency_id": 674,
    },
    {
        "agency_id": 758,
        "agency_code": "HHS-SAMHS-SAMHSA",
        "agency_name": "Substance Abuse and Mental Health Services Adminis",
        "top_level_agency_id": 674,
    },
    {
        "agency_id": 915,
        "agency_code": "USAID-ETH",
        "agency_name": "Ethiopia USAID-Addis Ababa ",
        "top_level_agency_id": 1,
    },
    {
        "agency_id": 969,
        "agency_code": "USAID-SAF",
        "agency_name": "South Africa USAID-Pretoria",
        "top_level_agency_id": 1,
    },
    {
        "agency_id": 980,
        "agency_code": "USDA-AMS",
        "agency_name": "Agricultural Marketing Service",
        "top_level_agency_id": 983,
    },
    {
        "agency_id": 981,
        "agency_code": "USDA-CSREE",
        "agency_name": "CSREES",
        "top_level_agency_id": 983,
    },
    {
        "agency_id": 997,
        "agency_code": "USDA-FAS",
        "agency_name": "Foreign Agricultural Service",
        "top_level_agency_id": 983,
    },
    {
        "agency_id": 1014,
        "agency_code": "USDA-FNS1",
        "agency_name": "Food and Nutrition Service",
        "top_level_agency_id": 983,
    },
    {
        "agency_id": 1015,
        "agency_code": "USDA-NRCS",
        "agency_name": "Natural Resources Conservation Service",
        "top_level_agency_id": 983,
    },
    {
        "agency_id": 1016,
        "agency_code": "USDA-FS",
        "agency_name": "Forest Service",
        "top_level_agency_id": 983,
    },
    {
        "agency_id": 1022,
        "agency_code": "USDA-NIFA",
        "agency_name": "National Institute of Food and Agriculture",
        "top_level_agency_id": 983,
    },
    {
        "agency_id": 1085,
        "agency_code": "USDA-RBCS",
        "agency_name": "Rural Business-Cooperative Service ",
        "top_level_agency_id": 983,
    },
    {
        "agency_id": 1102,
        "agency_code": "USDOJ-BOP-NIC",
        "agency_name": "National Institute of Corrections",
        "top_level_agency_id": 1105,
    },
    {
        "agency_id": 1104,
        "agency_code": "USDOJ-OJP-BJA",
        "agency_name": "Bureau of Justice Assistance",
        "top_level_agency_id": 1105,
    },
    {
        "agency_id": 1109,
        "agency_code": "USDA-RUS",
        "agency_name": "Rural Utilities Service",
        "top_level_agency_id": 983,
    },
    {
        "agency_id": 1111,
        "agency_code": "USDOJ-OJP-BJS",
        "agency_name": "Bureau of Justice Statistics",
        "top_level_agency_id": 1105,
    },
    {
        "agency_id": 1113,
        "agency_code": "USDOJ-OJP-NIJ",
        "agency_name": "National Institute of Justice",
        "top_level_agency_id": 1105,
    },
    {
        "agency_id": 1114,
        "agency_code": "USDOJ-OJP-OJJDP",
        "agency_name": "Office of Juvenile Justice Delinquency Prevention ",
        "top_level_agency_id": 1105,
    },
    {
        "agency_id": 1121,
        "agency_code": "USDOJ-OJP-OVW",
        "agency_name": "Office on Violence Against Women",
        "top_level_agency_id": 1105,
    },
    {
        "agency_id": 1122,
        "agency_code": "USDOJ-OJP-OVC",
        "agency_name": "Office for Victims of Crime",
        "top_level_agency_id": 1105,
    },
]


def _build_agencies(db_session: db.Session) -> None:
    # Create a static set of agencies, only if they don't already exist
    agencies = db_session.query(Agency).all()
    agency_codes = set([a.agency_code for a in agencies])

    for agency_to_create in AGENCIES_TO_CREATE:
        if agency_to_create["agency_code"] in agency_codes:
            continue

        logger.info("Creating agency %s in agency table", agency_to_create["agency_code"])
        factories.AgencyFactory.create(**agency_to_create)
