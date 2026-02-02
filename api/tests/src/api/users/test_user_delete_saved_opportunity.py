import pytest

from src.auth.api_jwt_auth import create_jwt_for_user
from src.db.models.user_models import UserSavedOpportunity
from tests.src.db.models.factories import (
    OpportunityFactory,
    UserFactory,
    UserSavedOpportunityFactory,
)


@pytest.fixture
def user(enable_factory_create, db_session):
    user = UserFactory.create()
    db_session.commit()
    return user


@pytest.fixture
def user_auth_token(user, db_session):
    token, _ = create_jwt_for_user(user, db_session)
    return token


def test_user_delete_saved_opportunity(
    client, enable_factory_create, db_session, user, user_auth_token
):
    # Create and save an opportunity
    opportunity = OpportunityFactory.create()
    saved_opp = UserSavedOpportunityFactory.create(
        user=user, opportunity=opportunity, is_deleted=False
    )
    # Delete the saved opportunity
    response = client.delete(
        f"/v1/users/{user.user_id}/saved-opportunities/{opportunity.opportunity_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Verify it was soft deleted
    db_session.expire_all()
    result = (
        db_session.query(UserSavedOpportunity)
        .filter(
            UserSavedOpportunity.user_id == saved_opp.user_id,
            UserSavedOpportunity.opportunity_id == saved_opp.opportunity_id,
        )
        .first()
    )

    assert result is not None
    assert result.is_deleted


def test_user_delete_other_users_saved_opportunity(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test that a user cannot delete another user's saved opportunity"""
    # Create another user and save an opportunity for them
    other_user = UserFactory.create()
    opportunity = OpportunityFactory.create()
    saved_opp = UserSavedOpportunityFactory.create(user=other_user, opportunity=opportunity)

    # Try to delete the other user's saved opportunity
    response = client.delete(
        f"/v1/users/{user.user_id}/saved-opportunities/{opportunity.opportunity_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 404
    assert response.json["message"] == "Saved opportunity not found"

    # Verify the saved opportunity still exists
    saved_opportunity = (
        db_session.query(UserSavedOpportunity)
        .filter(
            UserSavedOpportunity.user_id == saved_opp.user_id,
            UserSavedOpportunity.opportunity_id == saved_opp.opportunity_id,
        )
        .first()
    )
    assert saved_opportunity is not None
    assert saved_opportunity.user_id == other_user.user_id
    assert saved_opportunity.opportunity_id == opportunity.opportunity_id
    assert not saved_opportunity.is_deleted


def test_user_delete_saved_opportunity_legacy(
    client, enable_factory_create, db_session, user, user_auth_token
):
    # Create and save an opportunity
    opportunity = OpportunityFactory.create()
    saved_opp = UserSavedOpportunityFactory.create(
        user=user, opportunity=opportunity, is_deleted=False
    )
    # Delete the saved opportunity
    response = client.delete(
        f"/v1/users/{user.user_id}/saved-opportunities/{opportunity.legacy_opportunity_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Verify it was soft deleted
    db_session.expire_all()
    result = (
        db_session.query(UserSavedOpportunity)
        .filter(
            UserSavedOpportunity.user_id == saved_opp.user_id,
            UserSavedOpportunity.opportunity_id == saved_opp.opportunity_id,
        )
        .first()
    )

    assert result is not None
    assert result.is_deleted


def test_user_delete_other_users_saved_opportunity_legacy(
    client, enable_factory_create, db_session, user, user_auth_token
):
    """Test that a user cannot delete another user's saved opportunity"""
    # Create another user and save an opportunity for them
    other_user = UserFactory.create()
    opportunity = OpportunityFactory.create()
    saved_opp = UserSavedOpportunityFactory.create(user=other_user, opportunity=opportunity)

    # Try to delete the other user's saved opportunity
    response = client.delete(
        f"/v1/users/{user.user_id}/saved-opportunities/{opportunity.legacy_opportunity_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 404
    assert response.json["message"] == "Saved opportunity not found"

    # Verify the saved opportunity still exists
    saved_opportunity = (
        db_session.query(UserSavedOpportunity)
        .filter(
            UserSavedOpportunity.user_id == saved_opp.user_id,
            UserSavedOpportunity.opportunity_id == saved_opp.opportunity_id,
        )
        .first()
    )
    assert saved_opportunity is not None
    assert saved_opportunity.user_id == other_user.user_id
    assert saved_opportunity.opportunity_id == opportunity.opportunity_id
    assert not saved_opportunity.is_deleted


def test_user_delete_saved_opportunity_unauthorized(
    client, enable_factory_create, db_session, user, user_auth_token
):
    # Create another user and save an opportunity for them
    other_user = UserFactory.create()
    opportunity = OpportunityFactory.create()
    UserSavedOpportunityFactory(user=other_user, opportunity=opportunity)

    # Try to delete someone else's saved opp using their user_id
    response = client.delete(
        f"/v1/users/{other_user.user_id}/saved-opportunities/{opportunity.opportunity_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"
