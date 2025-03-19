from datetime import date

import pytest

from src.auth.api_jwt_auth import create_jwt_for_user
from src.constants.lookup_constants import (
    ApplicantType,
    FundingCategory,
    FundingInstrument,
    OpportunityStatus,
)
from src.db.models.user_models import UserSavedOpportunity
from tests.src.api.opportunities_v1.test_opportunity_route_search import build_opp
from tests.src.db.models.factories import (
    OpportunityFactory,
    UserFactory,
    UserSavedOpportunityFactory,
)

AWARD = build_opp(
    opportunity_title="Hutchinson and Sons 1972 award",
    opportunity_number="ZW-29-AWD-622",
    agency="USAID",
    summary_description="The purpose of this Notice of Funding Opportunity (NOFO) is to support research into Insurance claims handler and how we might Innovative didactic hardware.",
    opportunity_status=OpportunityStatus.FORECASTED,
    assistance_listings=[("95.579", "Moore-Murray")],
    applicant_types=[ApplicantType.OTHER],
    funding_instruments=[FundingInstrument.GRANT],
    funding_categories=[FundingCategory.SCIENCE_TECHNOLOGY_AND_OTHER_RESEARCH_AND_DEVELOPMENT],
    post_date=date(2020, 12, 8),
    close_date=date(2025, 12, 8),
    is_cost_sharing=True,
    expected_number_of_awards=1,
    award_floor=42500,
    award_ceiling=850000,
    estimated_total_program_funding=6000,
)

NATURE = build_opp(
    opportunity_title="Research into Conservation officer, nature industry",
    opportunity_number="IP-67-EXT-978",
    agency="USAID",
    summary_description="The purpose of this Notice of Funding Opportunity (NOFO) is to support research into Forensic psychologist and how we might Synchronized fault-tolerant workforce.",
    opportunity_status=OpportunityStatus.FORECASTED,
    assistance_listings=[("86.606", "Merritt, Williams and Church")],
    applicant_types=[ApplicantType.OTHER],
    funding_instruments=[FundingInstrument.GRANT],
    funding_categories=[FundingCategory.SCIENCE_TECHNOLOGY_AND_OTHER_RESEARCH_AND_DEVELOPMENT],
    post_date=date(2002, 10, 8),
    close_date=date(2026, 12, 28),
    is_cost_sharing=True,
    expected_number_of_awards=1,
    award_floor=502500,
    award_ceiling=9050000,
    estimated_total_program_funding=6000,
)

EMBASSY = build_opp(
    opportunity_title="Embassy program for Conservation officer, nature in Albania",
    opportunity_number="USDOJ-61-543",
    agency="USAID",
    summary_description="<div>Method the home father forget million partner become. Short long after ready husband any.<div>",
    opportunity_status=OpportunityStatus.FORECASTED,
    assistance_listings=[("85.997", "Albania")],
    applicant_types=[ApplicantType.OTHER],
    funding_instruments=[FundingInstrument.GRANT],
    funding_categories=[FundingCategory.SCIENCE_TECHNOLOGY_AND_OTHER_RESEARCH_AND_DEVELOPMENT],
    post_date=date(2002, 10, 8),
    close_date=None,
    is_cost_sharing=True,
    expected_number_of_awards=1,
    award_floor=502500,
    award_ceiling=9050000,
    estimated_total_program_funding=6000,
)


@pytest.fixture
def user(enable_factory_create, db_session):
    return UserFactory.create()


@pytest.fixture
def user_auth_token(user, db_session):
    token, _ = create_jwt_for_user(user, db_session)
    return token


@pytest.fixture(autouse=True, scope="function")
def clear_opportunities(db_session):
    db_session.query(UserSavedOpportunity).delete()
    db_session.commit()
    yield


def test_user_get_saved_opportunities(
    client, user, user_auth_token, enable_factory_create, db_session
):
    # Create an opportunity and save it for the user
    opportunity = OpportunityFactory.create(opportunity_title="Test Opportunity")
    UserSavedOpportunityFactory.create(user=user, opportunity=opportunity)

    # Make the request
    response = client.post(
        f"/v1/users/{user.user_id}/saved-opportunities/list",
        headers={"X-SGG-Token": user_auth_token},
        json={
            "pagination": {
                "page_offset": 1,
                "page_size": 25,
            }
        },
    )

    assert response.status_code == 200
    assert len(response.json["data"]) == 1
    assert response.json["data"][0]["opportunity_id"] == opportunity.opportunity_id
    assert response.json["data"][0]["opportunity_title"] == opportunity.opportunity_title


def test_get_saved_opportunities_unauthorized_user(client, enable_factory_create, db_session, user):
    """Test that a user cannot view another user's saved opportunities"""
    # Create a user and get their token
    user = UserFactory.create()
    token, _ = create_jwt_for_user(user, db_session)

    # Create another user and save an opportunity for them
    other_user = UserFactory.create()
    opportunity = OpportunityFactory.create()
    UserSavedOpportunityFactory.create(user=other_user, opportunity=opportunity)

    # Try to get the other user's saved opportunities
    response = client.post(
        f"/v1/users/{other_user.user_id}/saved-opportunities/list",
        headers={"X-SGG-Token": token},
        json={
            "pagination": {
                "page_offset": 1,
                "page_size": 25,
            }
        },
    )

    assert response.status_code == 401
    assert response.json["message"] == "Unauthorized user"

    # Try with a non-existent user ID
    different_user_id = "123e4567-e89b-12d3-a456-426614174000"
    response = client.post(
        f"/v1/users/{different_user_id}/saved-opportunities/list",
        headers={"X-SGG-Token": token},
        json={
            "pagination": {
                "page_offset": 1,
                "page_size": 25,
            }
        },
    )

    assert response.status_code == 401
    assert response.json["message"] == "Unauthorized user"


@pytest.mark.parametrize(
    "sort_order,expected_result",
    [
        (
            # Multi-Sort
            [
                {"order_by": "updated_at", "sort_direction": "ascending"},
                {"order_by": "opportunity_title", "sort_direction": "descending"},
            ],
            [AWARD, NATURE, EMBASSY],
        ),
        # Order by close_date, None should be last
        (
            [{"order_by": "close_date", "sort_direction": "ascending"}],
            [AWARD, NATURE, EMBASSY],
        ),
        # Default order
        (None, [EMBASSY, AWARD, NATURE]),
    ],
)
def test_get_saved_opportunities_sorting(
    client, enable_factory_create, db_session, user, user_auth_token, sort_order, expected_result
):

    UserSavedOpportunityFactory.create(
        user=user, opportunity=NATURE, updated_at="2024-10-01", created_at="2024-01-01"
    )
    UserSavedOpportunityFactory.create(
        user=user, opportunity=AWARD, updated_at="2024-05-01", created_at="2024-01-02"
    )
    UserSavedOpportunityFactory.create(
        user=user, opportunity=EMBASSY, updated_at="2024-12-01", created_at="2024-01-03"
    )

    # Make the request
    pagination = {"pagination": {"page_offset": 1, "page_size": 25}}
    if sort_order:
        pagination["pagination"]["sort_order"] = sort_order

    response = client.post(
        f"/v1/users/{user.user_id}/saved-opportunities/list",
        headers={"X-SGG-Token": user_auth_token},
        json=pagination,
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    opportunities = response.json["data"]

    assert len(opportunities) == len(expected_result)
    assert [opp["opportunity_id"] for opp in opportunities] == [
        opp.opportunity_id for opp in expected_result
    ]


def test_user_get_only_own_saved_opportunities(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test that users only get their own saved opportunities, not those of other users"""
    # Create an opportunity and save it for the current user
    user_opportunity = OpportunityFactory.create(opportunity_title="User's Opportunity")
    UserSavedOpportunityFactory.create(user=user, opportunity=user_opportunity)
    
    # Create another user with their own saved opportunity
    other_user = UserFactory.create()
    other_opportunity = OpportunityFactory.create(opportunity_title="Other User's Opportunity")
    UserSavedOpportunityFactory.create(user=other_user, opportunity=other_opportunity)
    
    # Create a third opportunity saved by both users
    shared_opportunity = OpportunityFactory.create(opportunity_title="Shared Opportunity")
    UserSavedOpportunityFactory.create(user=user, opportunity=shared_opportunity)
    UserSavedOpportunityFactory.create(user=other_user, opportunity=shared_opportunity)
    
    # Make the request for the current user
    response = client.post(
        f"/v1/users/{user.user_id}/saved-opportunities/list",
        headers={"X-SGG-Token": user_auth_token},
        json={
            "pagination": {
                "page_offset": 1,
                "page_size": 25,
            }
        },
    )
    
    # Verify the response
    assert response.status_code == 200
    assert len(response.json["data"]) == 2  # User should see only their 2 saved opportunities
    
    # Get the opportunity IDs from the response
    opportunity_ids = [opp["opportunity_id"] for opp in response.json["data"]]
    
    # Verify that the user sees their own opportunities but not the other user's
    assert user_opportunity.opportunity_id in opportunity_ids
    assert shared_opportunity.opportunity_id in opportunity_ids
    assert other_opportunity.opportunity_id not in opportunity_ids
    
    # Verify the opportunity titles
    opportunity_titles = [opp["opportunity_title"] for opp in response.json["data"]]
    assert "User's Opportunity" in opportunity_titles
    assert "Shared Opportunity" in opportunity_titles
    assert "Other User's Opportunity" not in opportunity_titles