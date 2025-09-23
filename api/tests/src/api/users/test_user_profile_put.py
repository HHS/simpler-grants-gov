import pytest

from src.db.models.user_models import UserProfile
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import UserFactory, UserProfileFactory


@pytest.fixture(autouse=True)
def clear_data(db_session):
    cascade_delete_from_db_table(db_session, UserProfile)


def test_user_update_profile(client, db_session, user_auth_token, user):
    user_profile = UserProfileFactory.create(user=user, first_name="Everett", last_name="Child")
    db_session.commit()

    data = {
        "first_name": "Henry",
        "middle_name": "Robert",
        "last_name": "Thomas",
    }

    response = client.put(
        f"/v1/users/{user.user_id}/profile", headers={"X-SGG-Token": user_auth_token}, json=data
    )
    db_session.refresh(user_profile)

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    res = db_session.query(UserProfile).filter(UserProfile.user_id == user.user_id).first()
    assert res.last_name == "Thomas"
    assert res.middle_name == "Robert"


def test_user_update_profile_unauthorized(
    client, db_session, user_auth_token, user, enable_factory_create
):
    response = client.put(
        f"/v1/users/{UserFactory.create().user_id}/profile",
        headers={"X-SGG-Token": user_auth_token},
        json={"first_name": "Henry"},
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"

    # Verify no record created
    res = db_session.query(UserProfile).first()
    assert not res


def test_user_update_profile_not_found(
    client, db_session, user_auth_token, user, enable_factory_create
):
    response = client.put(
        f"/v1/users/{user.user_id}/profile",
        headers={"X-SGG-Token": user_auth_token},
        json={"first_name": "Henry"},
    )

    assert response.status_code == 404
    assert response.json["message"] == f"User profile not found for user_id: {user.user_id}"

    # Verify no record created
    res = db_session.query(UserProfile).first()
    assert not res
