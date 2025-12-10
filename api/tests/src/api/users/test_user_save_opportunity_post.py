import uuid

from src.db.models.user_models import UserSavedOpportunity
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import OpportunityFactory, UserSavedOpportunityFactory


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

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"

    # Verify no opportunity was saved
    saved_opportunities = (
        db_session.query(UserSavedOpportunity)
        .filter(
            UserSavedOpportunity.user_id == different_user_id,
            UserSavedOpportunity.opportunity_id == opportunity.opportunity_id,
        )
        .first()
    )
    assert not saved_opportunities


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
    saved_opportunities = (
        db_session.query(UserSavedOpportunity)
        .filter(
            UserSavedOpportunity.user_id == user.user_id,
            UserSavedOpportunity.opportunity_id == opportunity.opportunity_id,
        )
        .first()
    )
    assert not saved_opportunities


def test_user_save_opportunity_post_invalid_request(
    client, user, user_auth_token, enable_factory_create, db_session
):
    cascade_delete_from_db_table(db_session, UserSavedOpportunity)

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
    saved_opportunity = (
        db_session.query(UserSavedOpportunity)
        .filter(
            UserSavedOpportunity.user_id == user.user_id,
            UserSavedOpportunity.opportunity_id == opportunity.opportunity_id,
        )
        .first()
    )
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
    saved_opp = (
        db_session.query(UserSavedOpportunity)
        .filter(
            UserSavedOpportunity.user_id == user.user_id,
            UserSavedOpportunity.opportunity_id == opportunity.opportunity_id,
        )
        .first()
    )
    assert saved_opp
    assert saved_opp.user_id == user.user_id
    assert saved_opp.opportunity_id == opportunity.opportunity_id
    assert not saved_opp.is_deleted


def test_user_save_opportunity_post_not_found(
    client, user, user_auth_token, enable_factory_create, db_session
):
    """Saving a non-existent opportunity should return 404."""
    response = client.post(
        f"/v1/users/{user.user_id}/saved-opportunities",
        headers={"X-SGG-Token": user_auth_token},
        json={"opportunity_id": uuid.uuid4()},
    )

    assert response.status_code == 404
