# Called by seed_local_db when running `make seed-db-local`
import logging
import uuid

import src.adapters.db as db
import tests.src.db.models.factories as factories
from src.constants.static_role_values import OPPORTUNITY_EDITOR, OPPORTUNITY_PUBLISHER
from src.db.models.agency_models import Agency
from src.db.models.user_models import User
from tests.lib.seed_data_utils import UserBuilder

logger = logging.getLogger(__name__)


# Agencies we want to create locally - note that these are a subset of popular
# agencies from production
AGENCIES_TO_CREATE = [
    {
        "agency_code": "DOC",
        "agency_id": "add4b88f-e895-4ca9-92f4-38ed34055247",
        "agency_name": "Department of Commerce",
    },
    {
        "agency_code": "DOD",
        "agency_id": "d8da27e1-c52b-4813-98c6-a339d2a3bff1",
        "agency_name": "Department of Defense",
    },
    {
        "agency_code": "DOE",
        "agency_id": "6dd59494-a4b0-4581-8fca-bf52c4a357bb",
        "agency_name": "Department of Energy",
    },
    {
        "agency_code": "DOI",
        "agency_id": "9dd6d044-3fea-4ed2-a6b7-77136d9fcf73",
        "agency_name": "Department of the Interior",
    },
    {
        "agency_code": "EPA",
        "agency_id": "3068ecf6-31d4-460f-aefa-b7fa9b3a9558",
        "agency_name": "Environmental Protection Agency",
    },
    {
        "agency_code": "HHS",
        "agency_id": "f331d496-e18e-47d5-95d4-f3b1231db153",
        "agency_name": "Department of Health and Human Services",
    },
    {
        "agency_code": "NSF",
        "agency_id": "16945d39-1564-479c-b438-ef8d0804f051",
        "agency_name": "National Science Foundation",
    },
    {
        "agency_code": "USAID",
        "agency_id": "094f7d5c-afe6-4e40-823b-d830076e9144",
        "agency_name": "Agency for International Development",
    },
    {
        "agency_code": "USDA",
        "agency_id": "7e8c323b-8e74-457c-861c-063eb2792e63",
        "agency_name": "Department of Agriculture",
    },
    {
        "agency_code": "USDOJ",
        "agency_id": "63a027ef-7d10-4b3b-b8d6-290e0b8e681a",
        "agency_name": "Department of Justice",
    },
    {
        "agency_code": "DOC-EDA",
        "agency_id": "f1829405-fd6e-4d7e-8b68-8b424e347d0d",
        "agency_name": "Economic Development Administration",
        "top_level_agency_id": "add4b88f-e895-4ca9-92f4-38ed34055247",
    },
    {
        "agency_code": "DOC-DOCNOAAERA",
        "agency_id": "20551cea-c165-4bf7-ac1d-ea35bc986275",
        "agency_name": "DOC NOAA - ERA Production",
        "top_level_agency_id": "add4b88f-e895-4ca9-92f4-38ed34055247",
    },
    {
        "agency_code": "DOC-NIST",
        "agency_id": "30abd45c-5f98-49e6-9efd-24dd5bf7abaa",
        "agency_name": "National Institute of Standards and Technology",
        "top_level_agency_id": "add4b88f-e895-4ca9-92f4-38ed34055247",
    },
    {
        "agency_code": "DOD-AFOSR",
        "agency_id": "4b50bcf3-258a-4341-95fd-cbff9b9bf875",
        "agency_name": "Air Force Office of Scientific Research",
        "top_level_agency_id": "d8da27e1-c52b-4813-98c6-a339d2a3bff1",
    },
    {
        "agency_code": "DOD-AFRL",
        "agency_id": "1a8a8ec0-b2e0-4c35-bbce-ea9ff9715afc",
        "agency_name": "Air Force -- Research Lab",
        "top_level_agency_id": "d8da27e1-c52b-4813-98c6-a339d2a3bff1",
    },
    {
        "agency_code": "DOD-AMC",
        "agency_id": "681acb0a-1ce2-4dcb-a1e8-0a97eb0bad75",
        "agency_name": "Dept of the Army -- Materiel Command",
        "top_level_agency_id": "d8da27e1-c52b-4813-98c6-a339d2a3bff1",
    },
    {
        "agency_code": "DOD-AMRAA",
        "agency_id": "d2f5e011-dee7-4d7c-be8c-25eabe374978",
        "agency_name": "Dept. of the Army -- USAMRAA",
        "top_level_agency_id": "d8da27e1-c52b-4813-98c6-a339d2a3bff1",
    },
    {
        "agency_code": "DOD-COE",
        "agency_id": "379a6f8a-f405-4433-adc4-1f7dd66917c8",
        "agency_name": "Dept. of the Army  --  Corps of Engineers",
        "top_level_agency_id": "d8da27e1-c52b-4813-98c6-a339d2a3bff1",
    },
    {
        "agency_code": "DOD-COE-ERDC",
        "agency_id": "3f2fb473-5fc1-4275-b99e-fba5b34846e2",
        "agency_name": "Engineer Research and Development Center",
        "top_level_agency_id": "d8da27e1-c52b-4813-98c6-a339d2a3bff1",
    },
    {
        "agency_code": "DOD-COE-FW",
        "agency_id": "59fdefc2-03cd-4300-888d-7763bd055018",
        "agency_name": "Fort Worth District",
        "top_level_agency_id": "d8da27e1-c52b-4813-98c6-a339d2a3bff1",
    },
    {
        "agency_code": "DOD-DARPA-MTO",
        "agency_id": "35e094a8-3969-475e-bcfe-08709b304bc4",
        "agency_name": "DARPA - Microsystems Technology Office ",
        "top_level_agency_id": "d8da27e1-c52b-4813-98c6-a339d2a3bff1",
    },
    {
        "agency_code": "DOD-DARPA-DSO",
        "agency_id": "442d7be8-f261-4837-b223-7f4d7ecea993",
        "agency_name": "DARPA - Defense Sciences Office",
        "top_level_agency_id": "d8da27e1-c52b-4813-98c6-a339d2a3bff1",
    },
    {
        "agency_code": "DOD-ONR",
        "agency_id": "ecc69106-35b6-4148-8007-41f6b821c926",
        "agency_name": "Office of Naval Research",
        "top_level_agency_id": "d8da27e1-c52b-4813-98c6-a339d2a3bff1",
    },
    {
        "agency_code": "DOD-ONR-FAC",
        "agency_id": "13c6d16f-234b-4172-92d9-7615799292d0",
        "agency_name": "NAVAL FACILITIES ENGINEERING COMMAND",
        "top_level_agency_id": "d8da27e1-c52b-4813-98c6-a339d2a3bff1",
    },
    {
        "agency_code": "DOE-GFO",
        "agency_id": "a55ac5c4-202c-4e53-93ee-23e14fb3e499",
        "agency_name": "Golden Field Office",
        "top_level_agency_id": "6dd59494-a4b0-4581-8fca-bf52c4a357bb",
    },
    {
        "agency_code": "DOE-NETL",
        "agency_id": "4a390b6d-f829-41e4-98d4-c18940c6fb66",
        "agency_name": "National Energy Technology Laboratory",
        "top_level_agency_id": "6dd59494-a4b0-4581-8fca-bf52c4a357bb",
    },
    {
        "agency_code": "DOI-BOR",
        "agency_id": "2431ea15-7966-4d33-831e-8884520b49e1",
        "agency_name": "Bureau of Reclamation",
        "top_level_agency_id": "9dd6d044-3fea-4ed2-a6b7-77136d9fcf73",
    },
    {
        "agency_code": "DOE-ARPAE",
        "agency_id": "c753c839-4e56-4704-9da5-fa2d714fc9db",
        "agency_name": "Advanced Research Projects Agency Energy ",
        "top_level_agency_id": "6dd59494-a4b0-4581-8fca-bf52c4a357bb",
    },
    {
        "agency_code": "DOI-BLM",
        "agency_id": "f442ac1a-f217-4a5d-999f-45425166a433",
        "agency_name": "Bureau of Land Management",
        "top_level_agency_id": "9dd6d044-3fea-4ed2-a6b7-77136d9fcf73",
    },
    {
        "agency_code": "DOI-BOR-LC",
        "agency_id": "8feec4e5-5d26-4ee7-bb35-2721b3ec66e6",
        "agency_name": "Bureau of Reclamation - Lower Colorado Region",
        "top_level_agency_id": "9dd6d044-3fea-4ed2-a6b7-77136d9fcf73",
    },
    {
        "agency_code": "DOI-BIA",
        "agency_id": "126717aa-f765-4e81-b678-846576dfecbc",
        "agency_name": "Bureau of Indian Affairs",
        "top_level_agency_id": "9dd6d044-3fea-4ed2-a6b7-77136d9fcf73",
    },
    {
        "agency_code": "DOI-BOR-MP",
        "agency_id": "5012b570-4684-457d-84a5-f1c1eff24027",
        "agency_name": "Bureau of Reclamation - Mid-Pacific Region",
        "top_level_agency_id": "9dd6d044-3fea-4ed2-a6b7-77136d9fcf73",
    },
    {
        "agency_code": "DOI-BOEM",
        "agency_id": "a36931a2-d183-454f-8cdd-6900e9c58287",
        "agency_name": "Bureau of Ocean Energy Management",
        "top_level_agency_id": "9dd6d044-3fea-4ed2-a6b7-77136d9fcf73",
    },
    {
        "agency_code": "DOI-FWS",
        "agency_id": "6842b063-018e-4b20-8e14-6d4ad914e056",
        "agency_name": "Fish and Wildlife Service",
        "top_level_agency_id": "9dd6d044-3fea-4ed2-a6b7-77136d9fcf73",
    },
    {
        "agency_code": "DOI-NPS",
        "agency_id": "aa3bf3a1-9af5-4510-82f7-f8af0a0ebc5d",
        "agency_name": "National Park Service",
        "top_level_agency_id": "9dd6d044-3fea-4ed2-a6b7-77136d9fcf73",
    },
    {
        "agency_code": "DOI-USGS1",
        "agency_id": "19a29756-f078-418a-ae4d-c0f2a3babf73",
        "agency_name": "Geological Survey",
        "top_level_agency_id": "9dd6d044-3fea-4ed2-a6b7-77136d9fcf73",
    },
    {
        "agency_code": "HHS-ACF",
        "agency_id": "924748b5-91ac-46a5-b4da-f8aad74eb9c8",
        "agency_name": "Administration for Children and Families",
        "top_level_agency_id": "f331d496-e18e-47d5-95d4-f3b1231db153",
    },
    {
        "agency_code": "HHS-AHRQ",
        "agency_id": "e8a944a5-419b-436c-9475-76b7692d537a",
        "agency_name": "Agency for Health Care Research and Quality",
        "top_level_agency_id": "f331d496-e18e-47d5-95d4-f3b1231db153",
    },
    {
        "agency_code": "HHS-ACF-OPRE",
        "agency_id": "f61e1758-3177-4195-ac84-220ed9702f6c",
        "agency_name": "Administration for Children and Families - OPRE",
        "top_level_agency_id": "f331d496-e18e-47d5-95d4-f3b1231db153",
    },
    {
        "agency_code": "HHS-ACF-FYSB",
        "agency_id": "a38a01ba-5077-4c05-9d65-a212a736a323",
        "agency_name": "Administration for Children & Families - ACYF/FYSB",
        "top_level_agency_id": "f331d496-e18e-47d5-95d4-f3b1231db153",
    },
    {
        "agency_code": "HHS-ACL",
        "agency_id": "9644c101-5d96-4b58-85e2-65eb87a9831f",
        "agency_name": "Administration for Community Living",
        "top_level_agency_id": "f331d496-e18e-47d5-95d4-f3b1231db153",
    },
    {
        "agency_code": "HHS-ACF-OHS",
        "agency_id": "709008b9-c756-4d29-9d1a-9440d859f450",
        "agency_name": "Administration for Children and Families - OHS",
        "top_level_agency_id": "f331d496-e18e-47d5-95d4-f3b1231db153",
    },
    {
        "agency_code": "HHS-AOA",
        "agency_id": "bd4ad683-fbbb-4514-9ba5-7d65a1397d4e",
        "agency_name": "Administration on Aging",
        "top_level_agency_id": "f331d496-e18e-47d5-95d4-f3b1231db153",
    },
    {
        "agency_code": "HHS-CDC",
        "agency_id": "1f1f6f09-3893-49b6-bbc8-316bdeeb1203",
        "agency_name": "Centers for Disease Control and Prevention",
        "top_level_agency_id": "f331d496-e18e-47d5-95d4-f3b1231db153",
    },
    {
        "agency_code": "HHS-CDC-HHSCDCERA",
        "agency_id": "83f5ca54-2f9f-4bf0-8246-ee43993b5ee6",
        "agency_name": "Centers for Disease Control and Prevention - ERA",
        "top_level_agency_id": "f331d496-e18e-47d5-95d4-f3b1231db153",
    },
    {
        "agency_code": "HHS-CDC-NCCDPHP",
        "agency_id": "2fe81c96-56e4-478d-91be-26fa1cdf9833",
        "agency_name": "Centers for Disease Control - NCCDPHP",
        "top_level_agency_id": "f331d496-e18e-47d5-95d4-f3b1231db153",
    },
    {
        "agency_code": "HHS-CDC-CGH",
        "agency_id": "f9cf167f-3f83-4bdf-8d83-34946f96f472",
        "agency_name": "Centers for Disease Control - CGH",
        "top_level_agency_id": "f331d496-e18e-47d5-95d4-f3b1231db153",
    },
    {
        "agency_code": "HHS-CMS",
        "agency_id": "c5cfab27-2d9d-42e1-84af-f98f78fd4592",
        "agency_name": "Centers for Medicare & Medicaid Services",
        "top_level_agency_id": "f331d496-e18e-47d5-95d4-f3b1231db153",
    },
    {
        "agency_code": "HHS-FDA",
        "agency_id": "b2dcff67-5003-4dd2-8cd0-8100c6c77a43",
        "agency_name": "Food and Drug Administration",
        "top_level_agency_id": "f331d496-e18e-47d5-95d4-f3b1231db153",
    },
    {
        "agency_code": "HHS-CDC-NCHHSTP",
        "agency_id": "38866dfb-8e5e-48d1-abc0-7e98f4a2c67b",
        "agency_name": "Centers for Disease Control - NCHHSTP",
        "top_level_agency_id": "f331d496-e18e-47d5-95d4-f3b1231db153",
    },
    {
        "agency_code": "HHS-OPHS",
        "agency_id": "c4e01478-d164-4bcf-9c41-c91f8d66bb38",
        "agency_name": "Office of the Assistant Secretary for Health",
        "top_level_agency_id": "f331d496-e18e-47d5-95d4-f3b1231db153",
    },
    {
        "agency_code": "HHS-HRSA",
        "agency_id": "27c7d40a-ce04-4720-8e24-dffd5067f15f",
        "agency_name": "Health Resources and Services Administration",
        "top_level_agency_id": "f331d496-e18e-47d5-95d4-f3b1231db153",
    },
    {
        "agency_code": "HHS-NIH11",
        "agency_id": "a47d1d8c-3d9b-4d28-84f5-f1c196685f9a",
        "agency_name": "National Institutes of Health",
        "top_level_agency_id": "f331d496-e18e-47d5-95d4-f3b1231db153",
    },
    {
        "agency_code": "HHS-IHS",
        "agency_id": "0efde09c-ff1c-4e37-a8a5-e002210a0a8a",
        "agency_name": "Indian Health Service",
        "top_level_agency_id": "f331d496-e18e-47d5-95d4-f3b1231db153",
    },
    {
        "agency_code": "HHS-SAMHS",
        "agency_id": "85616f05-3ba3-447f-a05a-cb298b1ca815",
        "agency_name": "Substance Abuse and Mental Health Services Admin",
        "top_level_agency_id": "f331d496-e18e-47d5-95d4-f3b1231db153",
    },
    {
        "agency_code": "HHS-SAMHS-SAMHSA",
        "agency_id": "f44cd20a-421d-4cd3-aff3-f06c7fddad0b",
        "agency_name": "Substance Abuse and Mental Health Services Adminis",
        "top_level_agency_id": "f331d496-e18e-47d5-95d4-f3b1231db153",
    },
    {
        "agency_code": "USAID-ETH",
        "agency_id": "9293aa4d-101b-4507-9725-6a180df2facd",
        "agency_name": "Ethiopia USAID-Addis Ababa ",
        "top_level_agency_id": "094f7d5c-afe6-4e40-823b-d830076e9144",
    },
    {
        "agency_code": "USAID-SAF",
        "agency_id": "31d754a4-6e0d-4593-b344-febef892548d",
        "agency_name": "South Africa USAID-Pretoria",
        "top_level_agency_id": "094f7d5c-afe6-4e40-823b-d830076e9144",
    },
    {
        "agency_code": "USDA-AMS",
        "agency_id": "1b6c6fc7-4594-4af5-be95-81222fb87101",
        "agency_name": "Agricultural Marketing Service",
        "top_level_agency_id": "7e8c323b-8e74-457c-861c-063eb2792e63",
    },
    {
        "agency_code": "USDA-CSREE",
        "agency_id": "4d8085ea-3b9b-4d8b-93b2-81244f40d1c1",
        "agency_name": "CSREES",
        "top_level_agency_id": "7e8c323b-8e74-457c-861c-063eb2792e63",
    },
    {
        "agency_code": "USDA-FAS",
        "agency_id": "8fcd214a-ca42-4971-b412-35417ccaaa5f",
        "agency_name": "Foreign Agricultural Service",
        "top_level_agency_id": "7e8c323b-8e74-457c-861c-063eb2792e63",
    },
    {
        "agency_code": "USDA-FNS1",
        "agency_id": "642155ef-0b6e-42b4-93a2-058c168cb80f",
        "agency_name": "Food and Nutrition Service",
        "top_level_agency_id": "7e8c323b-8e74-457c-861c-063eb2792e63",
    },
    {
        "agency_code": "USDA-NRCS",
        "agency_id": "59857421-1107-4f0d-a0b5-e63e64ae6d92",
        "agency_name": "Natural Resources Conservation Service",
        "top_level_agency_id": "7e8c323b-8e74-457c-861c-063eb2792e63",
    },
    {
        "agency_code": "USDA-FS",
        "agency_id": "d0f4fb1f-86b1-4d96-9df0-76a4ec9224aa",
        "agency_name": "Forest Service",
        "top_level_agency_id": "7e8c323b-8e74-457c-861c-063eb2792e63",
    },
    {
        "agency_code": "USDA-NIFA",
        "agency_id": "c9881349-62ae-42f6-b61e-2376bda388b7",
        "agency_name": "National Institute of Food and Agriculture",
        "top_level_agency_id": "7e8c323b-8e74-457c-861c-063eb2792e63",
    },
    {
        "agency_code": "USDA-RBCS",
        "agency_id": "5193dca5-442b-4b22-a750-ccfb19c081cf",
        "agency_name": "Rural Business-Cooperative Service ",
        "top_level_agency_id": "7e8c323b-8e74-457c-861c-063eb2792e63",
    },
    {
        "agency_code": "USDOJ-BOP-NIC",
        "agency_id": "45e03407-f69c-4083-89c1-b69b4122608c",
        "agency_name": "National Institute of Corrections",
        "top_level_agency_id": "63a027ef-7d10-4b3b-b8d6-290e0b8e681a",
    },
    {
        "agency_code": "USDOJ-OJP-BJA",
        "agency_id": "48a6d0db-c4d1-4337-9a13-8c9577fa6f32",
        "agency_name": "Bureau of Justice Assistance",
        "top_level_agency_id": "63a027ef-7d10-4b3b-b8d6-290e0b8e681a",
    },
    {
        "agency_code": "USDA-RUS",
        "agency_id": "9c2f47fe-5d47-4007-8735-84fd65138848",
        "agency_name": "Rural Utilities Service",
        "top_level_agency_id": "7e8c323b-8e74-457c-861c-063eb2792e63",
    },
    {
        "agency_code": "USDOJ-OJP-BJS",
        "agency_id": "950da556-a502-4f36-a659-d5039079b2da",
        "agency_name": "Bureau of Justice Statistics",
        "top_level_agency_id": "63a027ef-7d10-4b3b-b8d6-290e0b8e681a",
    },
    {
        "agency_code": "USDOJ-OJP-NIJ",
        "agency_id": "9f8cd8db-a99b-4ead-a95d-261e3877b4f4",
        "agency_name": "National Institute of Justice",
        "top_level_agency_id": "63a027ef-7d10-4b3b-b8d6-290e0b8e681a",
    },
    {
        "agency_code": "USDOJ-OJP-OJJDP",
        "agency_id": "76c7cf53-5af3-4b27-bacc-32e734b8d201",
        "agency_name": "Office of Juvenile Justice Delinquency Prevention ",
        "top_level_agency_id": "63a027ef-7d10-4b3b-b8d6-290e0b8e681a",
    },
    {
        "agency_code": "USDOJ-OJP-OVW",
        "agency_id": "cdb20e5f-cc51-47ef-83e0-c67bf31252ea",
        "agency_name": "Office on Violence Against Women",
        "top_level_agency_id": "63a027ef-7d10-4b3b-b8d6-290e0b8e681a",
    },
    {
        "agency_code": "USDOJ-OJP-OVC",
        "agency_id": "6214b14c-074f-4b1b-866c-b029ab0e9a7d",
        "agency_name": "Office for Victims of Crime",
        "top_level_agency_id": "63a027ef-7d10-4b3b-b8d6-290e0b8e681a",
    },
    {
        "agency_code": "CLOSED",
        "agency_id": "add4b8ff-e895-4ca9-92f4-38ed34055247",
        "agency_name": "Agency of closed opportunities",
    },
    {
        "agency_code": "ARCHIVED",
        "agency_id": "add4bfff-e895-4ca9-92f4-38ed34055247",
        "agency_name": "Agency of archived opportunities",
    },
]


def _build_agencies(db_session: db.Session) -> None:
    # Create a static set of agencies, only if they don't already exist
    agencies = db_session.query(Agency).all()
    agency_codes = set([a.agency_code for a in agencies])
    agencies_created = []

    for agency_to_create in AGENCIES_TO_CREATE:
        if agency_to_create["agency_code"] in agency_codes:
            continue

        logger.info("Creating agency %s in agency table", agency_to_create["agency_code"])
        new_agency = factories.AgencyFactory.create(**agency_to_create)
        if len(agencies_created) < 5:
            agencies_created.append(new_agency)

    if len(agencies_created) == 0:
        agencies_created = agencies
    _build_agency_users(db_session, agencies_created)


def _build_agency_users(db_session: db.Session, agencies_created: list[Agency]) -> None:
    # Create some users for a few agencies with roles
    logger.info("Creating/updating agency users")
    user_scenarios = []

    ###############################
    # User with a single agency with the opportunity editor role
    ###############################
    (
        UserBuilder(
            uuid.UUID("25dea202-fac8-48f6-ac52-0ec06d7176e0"),
            db_session,
            "user with one agency with the opportunity editor role",
        )
        .with_oauth_login("one_agency_opp_edit")
        .with_api_key("one_agency_opp_edit_key")
        .with_jwt_auth()
        .with_agency(agencies_created[0], roles=[OPPORTUNITY_EDITOR])
        .build()
    )

    user_scenarios.append(
        "one_agency_opp_edit - Opportunity Editor for Department of Commerce (DOC)"
    )

    ###############################
    # User with a single agency with the opportunity publisher role
    ###############################
    (
        UserBuilder(
            uuid.UUID("8baafd12-a523-41d6-8c19-bf67fff6ac99"),
            db_session,
            "user with one agency with the opportunity publisher role",
        )
        .with_oauth_login("one_agency_opp_pub")
        .with_api_key("one_agency_opp_pub_key")
        .with_jwt_auth()
        .with_agency(agencies_created[3], roles=[OPPORTUNITY_PUBLISHER])
        .build()
    )

    user_scenarios.append(
        "one_agency_opp_pub - Opportunity Publisher for Department of Energy (DOE)"
    )

    ###############################
    # User with two agencies, opportunity publisher for both
    ###############################
    (
        UserBuilder(
            uuid.UUID("b6e1561e-65ac-4793-b7c0-c3abced6051f"),
            db_session,
            "user with two agencies, opportunity publisher for both",
        )
        .with_oauth_login("two_agency_opp_pub")
        .with_api_key("two_agency_opp_pub_key")
        .with_jwt_auth()
        .with_agency(agencies_created[0], roles=[OPPORTUNITY_PUBLISHER])
        .with_agency(agencies_created[1], roles=[OPPORTUNITY_PUBLISHER])
        .build()
    )

    user_scenarios.append("two_agency_opp_pub - Opportunity Publisher for DOC and DOD")

    ###############################
    # User with three agencies with the opportunity editor role for all
    ###############################
    (
        UserBuilder(
            uuid.UUID("ae47bc37-2b7e-472a-a93c-d4e9b391b86e"),
            db_session,
            "user with three agencies and the opportunity editor role",
        )
        .with_oauth_login("three_agency_opp_edit")
        .with_api_key("three_agency_opp_edit_key")
        .with_jwt_auth()
        .with_agency(agencies_created[0], roles=[OPPORTUNITY_EDITOR])
        .with_agency(agencies_created[1], roles=[OPPORTUNITY_EDITOR])
        .with_agency(agencies_created[2], roles=[OPPORTUNITY_EDITOR])
        .build()
    )

    user_scenarios.append("three_agency_opp_edit - Opportunity Editor for DOC, DOD and DOE")

    ###############################
    # User with different roles for different agencies
    ###############################
    (
        UserBuilder(
            uuid.UUID("79a19a2c-d89e-4baf-a32c-091bcfb81f75"),
            db_session,
            "user with different roles for different agencies",
        )
        .with_oauth_login("mix_agency_roles")
        .with_api_key("mix_agency_roles_key")
        .with_jwt_auth()
        .with_agency(agencies_created[0], roles=[OPPORTUNITY_EDITOR])
        .with_agency(agencies_created[1], roles=[OPPORTUNITY_PUBLISHER])
        .with_agency(agencies_created[2], roles=[OPPORTUNITY_EDITOR])
        .with_agency(agencies_created[3], roles=[OPPORTUNITY_PUBLISHER])
        .build()
    )

    user_scenarios.append(
        "mix_agency_roles - Opportunity Editor for DOC & DOE and Publisher for DOD & DOI"
    )

    ##############################################################
    # Log output
    ##############################################################

    # Log summary of all created user scenarios
    logger.info("=== USER SCENARIOS SUMMARY ===")
    logger.info(f"Created {len(user_scenarios)} user scenarios with role-based access:")
    for scenario in user_scenarios:
        logger.info(f"• {scenario}")
