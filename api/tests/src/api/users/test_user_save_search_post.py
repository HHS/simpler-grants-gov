import uuid
from datetime import date

from src.api.opportunities_v1.opportunity_schemas import OpportunityV1Schema
from src.constants.lookup_constants import (
    ApplicantType,
    FundingCategory,
    FundingInstrument,
    OpportunityStatus,
)
from src.db.models.user_models import UserSavedSearch
from tests.src.api.opportunities_v1.conftest import get_search_request
from tests.src.api.opportunities_v1.test_opportunity_route_search import build_opp
from tests.src.db.models.factories import UserFactory

SPORTS = build_opp(
    opportunity_title="Research into Sports administrator industry",
    opportunity_number="EFG8532950",
    agency="USAID",
    summary_description="HHS-CDC is looking to further investigate this topic. Car matter style top quality generation effort. Computer purpose while consumer left.",
    opportunity_status=OpportunityStatus.FORECASTED,
    assistance_listings=[("79.718", "Huff LLC")],
    applicant_types=[ApplicantType.OTHER],
    funding_instruments=[FundingInstrument.GRANT],
    funding_categories=[FundingCategory.SCIENCE_TECHNOLOGY_AND_OTHER_RESEARCH_AND_DEVELOPMENT],
    post_date=date(2019, 12, 8),
    close_date=date(2024, 12, 28),
    is_cost_sharing=True,
    expected_number_of_awards=1,
    award_floor=402500,
    award_ceiling=8050000,
    estimated_total_program_funding=5000,
)
MEDICAL_LABORATORY = build_opp(
    opportunity_title="Research into Medical laboratory scientific officer industry",
    opportunity_number="AO-44-EMC-878",
    agency="USAID",
    summary_description="HHS-CDC is looking to further investigate this topic. Car matter style top quality generation effort. Computer purpose while consumer left.",
    opportunity_status=OpportunityStatus.FORECASTED,
    assistance_listings=[("43.012", "Brown LLC")],
    applicant_types=[ApplicantType.OTHER],
    funding_instruments=[FundingInstrument.GRANT],
    funding_categories=[FundingCategory.SCIENCE_TECHNOLOGY_AND_OTHER_RESEARCH_AND_DEVELOPMENT],
    post_date=date(2025, 1, 25),  #
    close_date=date(2025, 6, 4),  #
    is_cost_sharing=True,  #
    expected_number_of_awards=1,
    award_floor=402500,
    award_ceiling=8050000,
    estimated_total_program_funding=5000,
)


def test_user_save_search_post_unauthorized_user(client, db_session, user, user_auth_token):
    # Try to save a search for a different user ID
    different_user = UserFactory.create()

    search_query = get_search_request(
        funding_instrument_one_of=[FundingInstrument.GRANT],
        agency_one_of=["LOC"],
    )

    response = client.post(
        f"/v1/users/{different_user.user_id}/saved-searches",
        headers={"X-SGG-Token": user_auth_token},
        json={"name": "Test Search", "search_query": search_query},
    )

    assert response.status_code == 401
    assert response.json["message"] == "Unauthorized user"

    # Verify no search was saved
    saved_searches = (
        db_session.query(UserSavedSearch)
        .filter(
            UserSavedSearch.user_id == different_user.user_id,
        )
        .first()
    )
    assert not saved_searches


def test_user_save_search_post_no_auth(client, db_session, user):
    search_query = get_search_request(
        funding_instrument_one_of=[FundingInstrument.GRANT],
        agency_one_of=["LOC"],
    )

    # Try to save a search without authentication
    response = client.post(
        f"/v1/users/{user.user_id}/saved-searches",
        json={"name": "Test Search", "search_query": search_query},
    )

    assert response.status_code == 401
    assert response.json["message"] == "Unable to process token"

    # Verify no search was saved
    saved_searches = (
        db_session.query(UserSavedSearch)
        .filter(
            UserSavedSearch.user_id == user.user_id,
        )
        .first()
    )
    assert not saved_searches == 0


def test_user_save_search_post_invalid_request(client, user, user_auth_token, db_session):
    # Make request with missing required fields
    response = client.post(
        f"/v1/users/{user.user_id}/saved-searches",
        headers={"X-SGG-Token": user_auth_token},
        json={},
    )

    assert response.status_code == 422  # Validation error

    # Verify no search was saved
    saved_searches = (
        db_session.query(UserSavedSearch)
        .filter(
            UserSavedSearch.user_id == user.user_id,
        )
        .first()
    )
    assert not saved_searches


def test_user_save_search_post(
    client,
    opportunity_index,
    search_client,
    user,
    user_auth_token,
    enable_factory_create,
    db_session,
    monkeypatch,
    opportunity_index_alias,
):
    # Test data
    search_name = "Test Search"
    search_query = get_search_request(
        funding_instrument_one_of=[FundingInstrument.GRANT],
        agency_one_of=["USAID"],
    )

    # Create search index
    index_name = f"test-opportunity-index-{uuid.uuid4().int}"
    search_client.create_index(index_name)

    # Load into the search index
    schema = OpportunityV1Schema()
    json_records = [schema.dump(opp) for opp in [SPORTS, MEDICAL_LABORATORY]]
    search_client.bulk_upsert(index_name, json_records, "opportunity_id")

    search_client.swap_alias_index(index_name, opportunity_index_alias)

    # Make the request to save a search
    response = client.post(
        f"/v1/users/{user.user_id}/saved-searches",
        headers={"X-SGG-Token": user_auth_token},
        json={"name": search_name, "search_query": search_query},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    # Verify the search was saved in the database
    saved_search = (
        db_session.query(UserSavedSearch)
        .filter(
            UserSavedSearch.user_id == user.user_id,
        )
        .first()
    )

    assert saved_search.user_id == user.user_id
    assert saved_search.name == search_name
    assert saved_search.search_query == {
        "query_operator": "AND",
        "format": "json",
        "filters": {"agency": {"one_of": ["USAID"]}, "funding_instrument": {"one_of": ["grant"]}},
        "pagination": {
            "page_size": 25,
            "page_offset": 1,
            "sort_order": [
                {
                    "order_by": "opportunity_id",
                    "sort_direction": "ascending",
                }
            ],
        },
    }
    # Verify pagination for the query was over-written. searched_opportunity_ids should be ordered by "post_date"
    assert saved_search.searched_opportunity_ids == [
        MEDICAL_LABORATORY.opportunity_id,
        SPORTS.opportunity_id,
    ]

    # Mark the saved search as soft deleted
    saved_search.is_deleted = True
    # Make the request to save the same opportunity
    response = client.post(
        f"/v1/users/{user.user_id}/saved-searches",
        headers={"X-SGG-Token": user_auth_token},
        json={"name": search_name, "search_query": search_query},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Verify a new saved search is created
    db_session.expire_all()
    saved_opp = (
        db_session.query(UserSavedSearch)
        .filter(
            UserSavedSearch.user_id == user.user_id,
        )
        .all()
    )
    assert len(saved_opp) == 2
    assert saved_opp[1].saved_search_id != saved_search.saved_search_id
    assert not saved_opp[0].is_deleted
