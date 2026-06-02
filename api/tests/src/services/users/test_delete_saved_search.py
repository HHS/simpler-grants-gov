import uuid

import apiflask.exceptions
import pytest
from grants_shared.adapters import db
from sqlalchemy import select

from src.api.response import ValidationErrorDetail
from src.db.models.user_models import UserSavedSearch
from src.services.users.delete_saved_search import delete_saved_search
from src.validation.validation_constants import ValidationErrorType
from tests.src.db.models.factories import UserFactory, UserSavedSearchFactory


def test_delete_saved_search_success(enable_factory_create, db_session: db.Session):
    """Test that delete_saved_search soft-deletes by setting is_deleted=True."""
    user = UserFactory.create()
    saved_search = UserSavedSearchFactory.create(user=user, is_deleted=False)

    delete_saved_search(db_session, user.user_id, saved_search.saved_search_id)

    # Refresh from DB and verify soft delete
    db_session.expire_all()
    result = db_session.execute(
        select(UserSavedSearch).where(
            UserSavedSearch.saved_search_id == saved_search.saved_search_id
        )
    ).scalar_one_or_none()

    assert result is not None
    assert result.is_deleted is True


def test_delete_saved_search_not_found(enable_factory_create, db_session: db.Session):
    """Test that delete_saved_search raises 404 with ValidationErrorDetail when search doesn't exist."""
    user = UserFactory.create()
    nonexistent_id = uuid.uuid4()

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        delete_saved_search(db_session, user.user_id, nonexistent_id)

    assert exc_info.value.status_code == 404
    assert "Saved search not found" in exc_info.value.message

    # Verify the validation_issues payload contains a properly typed ValidationErrorDetail
    validation_issues = exc_info.value.extra_data.get("validation_issues", [])
    assert len(validation_issues) == 1
    issue = validation_issues[0]
    assert isinstance(issue, ValidationErrorDetail)
    assert issue.type == ValidationErrorType.SAVED_ITEM_NOT_FOUND
    assert issue.message == "Saved search not found"


def test_delete_saved_search_wrong_user(enable_factory_create, db_session: db.Session):
    """Test that delete_saved_search raises 404 when search belongs to a different user."""
    user1 = UserFactory.create()
    user2 = UserFactory.create()
    saved_search = UserSavedSearchFactory.create(user=user1, is_deleted=False)

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        delete_saved_search(db_session, user2.user_id, saved_search.saved_search_id)

    assert exc_info.value.status_code == 404

    # Verify the original search was NOT deleted
    db_session.expire_all()
    result = db_session.execute(
        select(UserSavedSearch).where(
            UserSavedSearch.saved_search_id == saved_search.saved_search_id
        )
    ).scalar_one_or_none()

    assert result is not None
    assert result.is_deleted is False


def test_delete_saved_search_already_soft_deleted(enable_factory_create, db_session: db.Session):
    """Test that delete_saved_search raises 404 when search is already soft-deleted.

    The query filters by the saved_search_id and user_id but does not exclude
    soft-deleted records, so a search that was already soft-deleted will still
    be found and its is_deleted flag will remain True.
    """
    user = UserFactory.create()
    saved_search = UserSavedSearchFactory.create(user=user, is_deleted=True)

    # The record still exists in DB (soft delete), so it WILL be found.
    # is_deleted will just remain True.
    delete_saved_search(db_session, user.user_id, saved_search.saved_search_id)

    db_session.expire_all()
    result = db_session.execute(
        select(UserSavedSearch).where(
            UserSavedSearch.saved_search_id == saved_search.saved_search_id
        )
    ).scalar_one_or_none()

    assert result is not None
    assert result.is_deleted is True