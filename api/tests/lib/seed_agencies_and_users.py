import logging
import uuid

from faker import Faker
from sqlalchemy import select

import src.adapters.db as db
from src.constants.static_role_values import OPPORTUNITY_EDITOR, OPPORTUNITY_PUBLISHER
from src.db.models.agency_models import Agency
from tests.lib.seed_data_utils import UserBuilder
from tests.src.db.models.factories import AgencyFactory

faker = Faker()
logger = logging.getLogger(__name__)

#############################################################
# Utilities for building data
#############################################################


def setup_agency(
    db_session: db.Session,
    agency_id: uuid.UUID,
    agency_code: str,
    agency_name: str,
    top_level_agency: Agency | None = None,
):
    results = db_session.execute(select(Agency).where(Agency.agency_id == agency_id))
    agency = results.scalar_one_or_none()

    if agency is None:
        # pass whatever else you want here as well.
        agency = AgencyFactory.create(
            agency_id=agency_id,
            agency_code=agency_code,
            agency_name=agency_name,
            top_level_agency=top_level_agency,
        )

    else:
        agency.agency_code = agency_code
        agency.top_level_agency = top_level_agency
        agency.agency_name = agency_name
        # whatever else you want to set

    return agency


#############################################################
# Build agencies / users / roles
#############################################################


def _build_agencies_and_users(db_session: db.Session) -> None:
    logger.info("Creating/updating agencies and users")

    ############################################
    # Agency 1
    ############################################
    agency1 = setup_agency(
        db_session,
        agency_id=uuid.UUID("094f7d5c-afe6-4e40-823b-d830076e9144"),
        agency_code="USAID",
        agency_name="Agency for International Development",
    )

    ############################################
    # Agency 2
    ############################################
    agency2 = setup_agency(
        db_session,
        agency_id=uuid.UUID("9293aa4d-101b-4507-9725-6a180df2facd"),
        agency_code="USAID-ETH",
        agency_name="Ethiopia USAID-Addis Ababa",
        top_level_agency=agency1,
    )

    ############################################
    # Agency 3
    ############################################
    agency3 = setup_agency(
        db_session,
        agency_id=uuid.UUID("31d754a4-6e0d-4593-b344-febef892548d"),
        agency_code="USAID-SAF",
        agency_name="South Africa USAID-Pretoria",
        top_level_agency=agency1,
    )

    ##############################################################
    # Users
    ##############################################################

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
        .with_agency(agency2, roles=[OPPORTUNITY_EDITOR])
        .build()
    )

    user_scenarios.append("one_agency_opp_edit - Opportunity Editor for USAID-ETH")

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
        .with_agency(agency2, roles=[OPPORTUNITY_PUBLISHER])
        .build()
    )

    user_scenarios.append("one_agency_opp_pub - Opportunity Publisher for USAID-ETH")

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
        .with_agency(agency2, roles=[OPPORTUNITY_PUBLISHER])
        .with_agency(agency3, roles=[OPPORTUNITY_PUBLISHER])
        .build()
    )

    user_scenarios.append("two_agency_opp_pub - Opportunity Publisher for USAID-ETH & USAID-SAF")

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
        .with_agency(agency2, roles=[OPPORTUNITY_EDITOR])
        .with_agency(agency3, roles=[OPPORTUNITY_PUBLISHER])
        .build()
    )

    user_scenarios.append(
        "mix_agency_roles - Opportunity Editor for USAID-ETH and Publisher for USAID-SAF"
    )

    ##############################################################
    # Log output
    ##############################################################

    # Log summary of all created user scenarios
    logger.info("=== USER SCENARIOS SUMMARY ===")
    logger.info(f"Created {len(user_scenarios)} user scenarios with role-based access:")
    for scenario in user_scenarios:
        logger.info(f"• {scenario}")
