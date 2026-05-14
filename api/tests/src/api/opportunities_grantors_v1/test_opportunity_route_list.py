import uuid

import pytest

from src.constants.lookup_constants import Privilege
from src.db.models.opportunity_models import Opportunity
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt_and_api_key
from tests.src.db.models.factories import (
    AgencyFactory,
    ApplicationFactory,
    ApplicationSubmissionFactory,
    AwardRecommendationFactory,
    CompetitionFactory,
    OpportunityFactory,
)


@pytest.fixture
def grantor_auth_data(db_session, enable_factory_create):
    user, agency, token, api_key_id = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[Privilege.VIEW_OPPORTUNITY],
    )
    return user, agency, token, api_key_id


@pytest.fixture
def award_recommendation_auth_data(db_session, enable_factory_create):
    user, agency, token, api_key_id = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[Privilege.VIEW_OPPORTUNITY],
    )
    return user, agency, token, api_key_id


@pytest.fixture
def no_permission_auth_data(db_session, enable_factory_create):
    user, agency, token, api_key_id = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[],
    )
    return user, agency, token, api_key_id


def test_list_opportunities_success(client, db_session, grantor_auth_data):
    user, agency, token, _ = grantor_auth_data

    opp1 = OpportunityFactory.create(
        agency_id=agency.agency_id,
        agency_code=agency.agency_code,
        opportunity_number="TEST-2026-001",
        opportunity_title="First Test Opportunity",
    )
    opp2 = OpportunityFactory.create(
        agency_id=agency.agency_id,
        agency_code=agency.agency_code,
        opportunity_number="TEST-2026-002",
        opportunity_title="Second Test Opportunity",
    )

    response = client.post(
        f"/v1/grantors/agencies/{agency.agency_id}/opportunities",
        headers={"X-SGG-Token": token},
        json={"pagination": {"page_offset": 1, "page_size": 25}},
    )

    assert response.status_code == 200
    response_json = response.get_json()
    assert response_json["message"] == "Success"

    data = response_json["data"]
    assert len(data) == 2

    pagination = response_json["pagination_info"]
    assert pagination["page_offset"] == 1
    assert pagination["page_size"] == 25
    assert pagination["total_records"] == 2
    assert pagination["total_pages"] == 1

    opp_ids = {opp["opportunity_id"] for opp in data}
    assert str(opp1.opportunity_id) in opp_ids
    assert str(opp2.opportunity_id) in opp_ids

    for opp in data:
        assert "opportunity_id" in opp
        assert "opportunity_number" in opp
        assert "opportunity_title" in opp
        assert "agency_code" in opp

    db_opps = db_session.query(Opportunity).filter(Opportunity.agency_id == agency.agency_id).all()
    assert len(db_opps) == 2


def test_list_opportunities_with_pagination(client, db_session, grantor_auth_data):
    user, agency, token, _ = grantor_auth_data

    for i in range(5):
        OpportunityFactory.create(
            agency_id=agency.agency_id,
            agency_code=agency.agency_code,
            opportunity_number=f"TEST-2026-{i:03d}",
        )

    response = client.post(
        f"/v1/grantors/agencies/{agency.agency_id}/opportunities",
        headers={"X-SGG-Token": token},
        json={"pagination": {"page_offset": 1, "page_size": 2}},
    )

    assert response.status_code == 200
    response_json = response.get_json()
    data = response_json["data"]
    assert len(data) == 2

    pagination = response_json["pagination_info"]
    assert pagination["total_records"] == 5
    assert pagination["total_pages"] == 3
    assert pagination["page_offset"] == 1
    assert pagination["page_size"] == 2

    response_page2 = client.post(
        f"/v1/grantors/agencies/{agency.agency_id}/opportunities",
        headers={"X-SGG-Token": token},
        json={"pagination": {"page_offset": 2, "page_size": 2}},
    )

    assert response_page2.status_code == 200
    data_page2 = response_page2.get_json()["data"]
    assert len(data_page2) == 2

    page1_ids = {opp["opportunity_id"] for opp in data}
    page2_ids = {opp["opportunity_id"] for opp in data_page2}
    assert len(page1_ids.intersection(page2_ids)) == 0


def test_list_opportunities_award_recommendation_ready_filter(
    client, db_session, award_recommendation_auth_data
):
    user, agency, token, _ = award_recommendation_auth_data

    opp_ready = OpportunityFactory.create(
        agency_id=agency.agency_id,
        agency_code=agency.agency_code,
        opportunity_number="READY-2026-001",
        is_simpler_grants_opportunity=True,
        is_draft=False,
    )
    competition_ready = CompetitionFactory.create(opportunity=opp_ready)
    app_ready = ApplicationFactory.create(competition=competition_ready)
    ApplicationSubmissionFactory.create(application=app_ready)

    OpportunityFactory.create(
        agency_id=agency.agency_id,
        agency_code=agency.agency_code,
        opportunity_number="NOT-READY-2026-001",
        is_simpler_grants_opportunity=True,
        is_draft=False,
    )

    opp_with_award_rec = OpportunityFactory.create(
        agency_id=agency.agency_id,
        agency_code=agency.agency_code,
        opportunity_number="HAS-AWARD-2026-001",
        is_simpler_grants_opportunity=True,
        is_draft=False,
    )
    competition_with_award = CompetitionFactory.create(opportunity=opp_with_award_rec)
    app_with_award = ApplicationFactory.create(competition=competition_with_award)
    ApplicationSubmissionFactory.create(application=app_with_award)
    AwardRecommendationFactory.create(opportunity=opp_with_award_rec)

    opp_draft = OpportunityFactory.create(
        agency_id=agency.agency_id,
        agency_code=agency.agency_code,
        opportunity_number="DRAFT-2026-001",
        is_simpler_grants_opportunity=True,
        is_draft=True,
    )
    competition_draft = CompetitionFactory.create(opportunity=opp_draft)
    app_draft = ApplicationFactory.create(competition=competition_draft)
    ApplicationSubmissionFactory.create(application=app_draft)

    response = client.post(
        f"/v1/grantors/agencies/{agency.agency_id}/opportunities",
        headers={"X-SGG-Token": token},
        json={
            "pagination": {"page_offset": 1, "page_size": 25},
            "filters": {"award_recommendation_ready": {"one_of": [True]}},
        },
    )

    assert response.status_code == 200
    response_json = response.get_json()
    data = response_json["data"]

    assert len(data) == 1
    assert data[0]["opportunity_id"] == str(opp_ready.opportunity_id)
    assert data[0]["opportunity_number"] == "READY-2026-001"


def test_list_opportunities_no_permission(client, db_session, no_permission_auth_data):
    user, agency, token, _ = no_permission_auth_data

    OpportunityFactory.create(
        agency_id=agency.agency_id,
        agency_code=agency.agency_code,
    )

    response = client.post(
        f"/v1/grantors/agencies/{agency.agency_id}/opportunities",
        headers={"X-SGG-Token": token},
        json={"pagination": {"page_offset": 1, "page_size": 25}},
    )

    assert response.status_code == 403


def test_list_opportunities_invalid_token(client, db_session, grantor_auth_data):
    user, agency, token, _ = grantor_auth_data

    OpportunityFactory.create(
        agency_id=agency.agency_id,
        agency_code=agency.agency_code,
    )

    response = client.post(
        f"/v1/grantors/agencies/{agency.agency_id}/opportunities",
        headers={"X-SGG-Token": "invalid_token"},
        json={"pagination": {"page_offset": 1, "page_size": 25}},
    )

    assert response.status_code == 401


def test_list_opportunities_agency_not_found(client, db_session, grantor_auth_data):
    user, agency, token, _ = grantor_auth_data

    fake_agency_id = uuid.uuid4()

    response = client.post(
        f"/v1/grantors/agencies/{fake_agency_id}/opportunities",
        headers={"X-SGG-Token": token},
        json={"pagination": {"page_offset": 1, "page_size": 25}},
    )

    assert response.status_code == 404


def test_list_opportunities_empty_result(client, db_session, grantor_auth_data):
    user, agency, token, _ = grantor_auth_data

    response = client.post(
        f"/v1/grantors/agencies/{agency.agency_id}/opportunities",
        headers={"X-SGG-Token": token},
        json={"pagination": {"page_offset": 1, "page_size": 25}},
    )

    assert response.status_code == 200
    response_json = response.get_json()
    data = response_json["data"]
    assert len(data) == 0

    pagination = response_json["pagination_info"]
    assert pagination["total_records"] == 0
    assert pagination["total_pages"] == 0


def test_list_opportunities_different_agency(client, db_session, enable_factory_create):
    user1, agency1, token1, _ = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[Privilege.VIEW_OPPORTUNITY],
    )

    agency2 = AgencyFactory.create()

    opp1 = OpportunityFactory.create(
        agency_id=agency1.agency_id,
        agency_code=agency1.agency_code,
        opportunity_number="AGENCY1-2026-001",
    )
    OpportunityFactory.create(
        agency_id=agency2.agency_id,
        agency_code=agency2.agency_code,
        opportunity_number="AGENCY2-2026-001",
    )

    response = client.post(
        f"/v1/grantors/agencies/{agency1.agency_id}/opportunities",
        headers={"X-SGG-Token": token1},
        json={"pagination": {"page_offset": 1, "page_size": 25}},
    )

    assert response.status_code == 200
    data = response.get_json()["data"]
    assert len(data) == 1
    assert data[0]["opportunity_id"] == str(opp1.opportunity_id)
    assert data[0]["opportunity_number"] == "AGENCY1-2026-001"

    db_agency1_opps = (
        db_session.query(Opportunity).filter(Opportunity.agency_id == agency1.agency_id).all()
    )
    assert len(db_agency1_opps) == 1
    assert db_agency1_opps[0].opportunity_number == "AGENCY1-2026-001"
