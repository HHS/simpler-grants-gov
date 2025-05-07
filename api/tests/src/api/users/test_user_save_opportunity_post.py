import uuid

import pytest

from src.db.models.user_models import UserSavedOpportunity
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import OpportunityFactory, UserSavedOpportunityFactory


@pytest.fixture(autouse=True)
def clear_opportunities(db_session):
    cascade_delete_from_db_table(db_session, UserSavedOpportunity)
    yield


def test_user_save_opportunity_post_unauthorized_user(
    client, db_session, user, user_auth_token, enable_factory_create
):
    # Create an opportunity
    opportunity = OpportunityFactory.create()

    # Try to save an opportunity for a different user ID
    different_user_id = uuid.uuid4()
    response = client.post(
        f"/v1/users/{different_user_id}/saved-opportunities",
        headers={"X-SGG-Token": user_auth_token},
        json={"opportunity_id": opportunity.opportunity_id},
    )

    assert response.status_code == 401
    assert response.json["message"] == "Unauthorized user"

    # Verify no opportunity was saved
    saved_opportunities = db_session.query(UserSavedOpportunity).all()
    assert len(saved_opportunities) == 0


def test_user_save_opportunity_post_no_auth(client, db_session, user, enable_factory_create):
    # Create an opportunity
    opportunity = OpportunityFactory.create()

    # Try to save an opportunity without authentication
    response = client.post(
        f"/v1/users/{user.user_id}/saved-opportunities",
        json={"opportunity_id": opportunity.opportunity_id},
    )

    assert response.status_code == 401
    assert response.json["message"] == "Unable to process token"

    # Verify no opportunity was saved
    saved_opportunities = db_session.query(UserSavedOpportunity).all()
    assert len(saved_opportunities) == 0


def test_user_save_opportunity_post_invalid_request(
    client, user, user_auth_token, enable_factory_create, db_session
):
    # Make request with missing opportunity_id
    response = client.post(
        f"/v1/users/{user.user_id}/saved-opportunities",
        headers={"X-SGG-Token": user_auth_token},
        json={},
    )

    assert response.status_code == 422  # Validation error

    # Verify no opportunity was saved
    saved_opportunities = db_session.query(UserSavedOpportunity).all()
    assert len(saved_opportunities) == 0


def test_user_save_opportunity_post(
    client, user, user_auth_token, enable_factory_create, db_session
):
    # Create an opportunity
    opportunity = OpportunityFactory.create()

    # Make the request to save an opportunity
    response = client.post(
        f"/v1/users/{user.user_id}/saved-opportunities",
        headers={"X-SGG-Token": user_auth_token},
        json={"opportunity_id": opportunity.opportunity_id},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Verify the opportunity was saved in the database
    saved_opportunity = db_session.query(UserSavedOpportunity).one()
    assert saved_opportunity.user_id == user.user_id
    assert saved_opportunity.opportunity_id == opportunity.opportunity_id


def test_user_save_opportunity_post_deleted(
    client, user, user_auth_token, enable_factory_create, db_session
):

    # Create a saved opportunity that was soft deleted
    opportunity = OpportunityFactory.create()
    UserSavedOpportunityFactory.create(opportunity=opportunity, is_deleted=True, user=user)
    # Make the request to save the same opportunity
    response = client.post(
        f"/v1/users/{user.user_id}/saved-opportunities",
        headers={"X-SGG-Token": user_auth_token},
        json={"opportunity_id": opportunity.opportunity_id},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Verify the saved opp is updated and a new saved opp is not created
    saved_opps = db_session.query(UserSavedOpportunity).all()
    assert len(saved_opps) == 1
    assert saved_opps[0].user_id == user.user_id
    assert saved_opps[0].opportunity_id == opportunity.opportunity_id
    assert not saved_opps[0].is_deleted
