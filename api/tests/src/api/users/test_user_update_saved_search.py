import uuid

import pytest

from src.db.models.user_models import UserSavedSearch, UserTokenSession
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import UserFactory, UserSavedSearchFactory


@pytest.fixture(autouse=True)
def clear_data(db_session):
    cascade_delete_from_db_table(db_session, UserSavedSearch)
    cascade_delete_from_db_table(db_session, UserTokenSession)
    yield
    db_session.query(UserSavedSearch).delete()
    db_session.commit()


def test_user_update_saved_search(client, db_session, user, user_auth_token):
    saved_search = UserSavedSearchFactory.create(
        user=user, name="Save Search", search_query={"keywords": "python"}
    )

    updated_name = "Update Search"
    response = client.put(
        f"/v1/users/{user.user_id}/saved-searches/{saved_search.saved_search_id}",
        headers={"X-SGG-Token": user_auth_token},
        json={"name": updated_name},
    )
    db_session.refresh(saved_search)

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Verify search was updated
    updated_saved_search = db_session.query(UserSavedSearch).first()

    assert updated_saved_search.name == updated_name


def test_user_update_saved_search_not_found(
    client,
    enable_factory_create,
    db_session,
    user,
    user_auth_token,
):
    # Try to update a non-existent search
    response = client.put(
        f"/v1/users/{user.user_id}/saved-searches/{uuid.uuid4()}",
        headers={"X-SGG-Token": user_auth_token},
        json={"name": "Update Search"},
    )

    assert response.status_code == 404
    assert response.json["message"] == "Saved search not found"


def test_user_update_saved_search_unauthorized(
    client, enable_factory_create, db_session, user, user_auth_token
):
    # Try to update a search with another user
    saved_search = UserSavedSearchFactory.create(
        user=user, name="Save Search", search_query={"keywords": "python"}
    )
    unauthorized_user = UserFactory.create()
    response = client.put(
        f"/v1/users/{unauthorized_user.user_id}/saved-searches/{saved_search.saved_search_id}",
        headers={"X-SGG-Token": user_auth_token},
        json={"name": "Update Search"},
    )

    db_session.refresh(saved_search)

    assert response.status_code == 403
    assert (
        response.json["message"]
        == "Forbidden"
    )

    # Verify search was not updated
    saved_searches = db_session.query(UserSavedSearch).first()
    assert saved_searches.name == saved_search.name


def test_user_update_saved_search_no_auth(
    client,
    enable_factory_create,
    db_session,
    user,
    user_auth_token,
):
    saved_search = UserSavedSearchFactory.create(
        user=user, name="Save Search", search_query={"keywords": "python"}
    )
    # Try to update a search without authentication
    response = client.put(
        f"/v1/users/{user.user_id}/saved-searches/{saved_search.saved_search_id}",
        json={"name": "Update Search"},
    )
    db_session.refresh(saved_search)

    assert response.status_code == 401
    assert response.json["message"] == "Unable to process token"

    # Verify search was not updated
    saved_searches = db_session.query(UserSavedSearch).first()
    assert saved_searches.name == saved_search.name
