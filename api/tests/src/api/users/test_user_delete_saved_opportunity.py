import pytest

from src.db.models.user_models import UserSavedOpportunity
from tests.src.db.models.factories import OpportunityFactory, UserFactory
from src.auth.api_jwt_auth import create_jwt_for_user


@pytest.fixture
def user(enable_factory_create, db_session):
    user = UserFactory.create()
    db_session.commit()
    return user


@pytest.fixture
def user_auth_token(user, db_session):
    token, _ = create_jwt_for_user(user, db_session)
    return token


@pytest.fixture(autouse=True)
def clear_saved_opportunities(db_session):
    db_session.query(UserSavedOpportunity).delete()
    db_session.commit()
    yield


def test_user_delete_saved_opportunity(
    client, enable_factory_create, db_session, user, user_auth_token
):
    # Create and save an opportunity
    opportunity = OpportunityFactory.create()
    saved = UserSavedOpportunity(user_id=user.user_id, opportunity_id=opportunity.opportunity_id)
    db_session.add(saved)
    db_session.commit()

    # Delete the saved opportunity
    response = client.delete(
        f"/v1/users/{user.user_id}/saved-opportunities/{opportunity.opportunity_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Verify it was deleted
    saved_count = db_session.query(UserSavedOpportunity).count()
    assert saved_count == 0

    # Delete the saved opportunity
    response = client.delete(
        f"/v1/users/{user.user_id}/saved-opportunities/1234567890",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 404
    assert response.json["message"] == "Saved opportunity not found"
