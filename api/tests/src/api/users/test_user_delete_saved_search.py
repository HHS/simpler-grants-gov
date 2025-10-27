import uuid

import pytest

from src.db.models.user_models import UserSavedSearch, UserTokenSession
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import UserFactory, UserSavedSearchFactory


@pytest.fixture
def saved_search(enable_factory_create, user, db_session):
    search = UserSavedSearchFactory.create(
        user=user, name="Test Search", search_query={"keywords": "python"}
    )
    db_session.commit()
    return search


@pytest.fixture(autouse=True)
def clear_data(db_session):
    cascade_delete_from_db_table(db_session, UserTokenSession)
    return


def test_user_delete_saved_search_unauthorized_user(
    client, enable_factory_create, db_session, user, user_auth_token, saved_search
):
    # Try to delete a search for a different user ID
    different_user = UserFactory.create()

    response = client.delete(
        f"/v1/users/{different_user.user_id}/saved-searches/{saved_search.saved_search_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"

    # Verify search was not deleted
    saved_searches = (
        db_session.query(UserSavedSearch)
        .filter(UserSavedSearch.saved_search_id == saved_search.saved_search_id)
        .all()
    )
    assert len(saved_searches) == 1


def test_user_delete_saved_search_no_auth(
    client, enable_factory_create, db_session, user, user_auth_token, saved_search
):
    # Try to delete a search without authentication
    response = client.delete(
        f"/v1/users/{user.user_id}/saved-searches/{saved_search.saved_search_id}",
    )

    assert response.status_code == 401
    assert response.json["message"] == "Unable to process token"

    # Verify search was not deleted
    saved_searches = (
        db_session.query(UserSavedSearch)
        .filter(UserSavedSearch.saved_search_id == saved_search.saved_search_id)
        .all()
    )
    assert len(saved_searches) == 1


def test_user_delete_saved_search_not_found(
    client,
    enable_factory_create,
    db_session,
    user,
    user_auth_token,
):
    # Try to delete a non-existent search
    response = client.delete(
        f"/v1/users/{user.user_id}/saved-searches/{uuid.uuid4()}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 404
    assert response.json["message"] == "Saved search not found"


def test_user_delete_saved_search(
    client, db_session, user, user_auth_token, enable_factory_create, saved_search
):
    response = client.delete(
        f"/v1/users/{user.user_id}/saved-searches/{saved_search.saved_search_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Verify the search was deleted
    db_session.expire_all()
    saved_searches = (
        db_session.query(UserSavedSearch)
        .filter(UserSavedSearch.saved_search_id == saved_search.saved_search_id)
        .all()
    )
    assert len(saved_searches) == 1
    assert saved_searches[0].is_deleted
