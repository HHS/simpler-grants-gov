import pytest

from src.auth.api_jwt_auth import create_jwt_for_user
from src.db.models.user_models import UserSavedOpportunity
from tests.src.db.models.factories import OpportunityFactory, UserFactory


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
def clear_opportunities(db_session):
    db_session.query(UserSavedOpportunity).delete()
    db_session.commit()
    yield


def test_user_get_saved_opportunities(
    client, user, user_auth_token, enable_factory_create, db_session
):
    # Create an opportunity and save it for the user
    opportunity = OpportunityFactory.create()
    saved = UserSavedOpportunity(user_id=user.user_id, opportunity_id=opportunity.opportunity_id)
    db_session.add(saved)
    db_session.commit()

    # Make the request
    response = client.get(
        f"/v1/users/{user.user_id}/saved-opportunities", headers={"X-SGG-Token": user_auth_token}
    )

    assert response.status_code == 200
    assert len(response.json["data"]) == 1
    assert response.json["data"][0]["opportunity_id"] == opportunity.opportunity_id
    assert response.json["data"][0]["opportunity_title"] == opportunity.opportunity_title
