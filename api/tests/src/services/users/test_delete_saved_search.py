import uuid

import apiflask.exceptions
import pytest
from grants_shared.adapters import db
from sqlalchemy import select

import tests.src.db.models.factories as factories
from src.db.models.user_models import UserSavedSearch
from src.services.users.delete_saved_search import delete_saved_search
from src.validation.validation_constants import ValidationErrorType


def test_delete_saved_search_success(enable_factory_create, db_session: db.Session):
    user = factories.UserFactory.create()
    saved_search = factories.UserSavedSearchFactory.create(user=user, is_deleted=False)

    delete_saved_search(db_session, user.user_id, saved_search.saved_search_id)

    result = db_session.execute(
        select(UserSavedSearch).where(
            UserSavedSearch.saved_search_id == saved_search.saved_search_id
        )
    ).scalar_one_or_none()
    assert result is not None
    assert result.is_deleted is True


def test_delete_saved_search_not_found(enable_factory_create, db_session: db.Session):
    user = factories.UserFactory.create()
    nonexistent_id = uuid.uuid4()

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        delete_saved_search(db_session, user.user_id, nonexistent_id)

    assert exc_info.value.status_code == 404
    assert exc_info.value.extra_data["validation_issues"][0]["type"] == ValidationErrorType.SAVED_ITEM_NOT_FOUND


def test_delete_saved_search_wrong_user(enable_factory_create, db_session: db.Session):
    user1 = factories.UserFactory.create()
    user2 = factories.UserFactory.create()
    saved_search = factories.UserSavedSearchFactory.create(user=user1, is_deleted=False)

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        delete_saved_search(db_session, user2.user_id, saved_search.saved_search_id)

    assert exc_info.value.status_code == 404
    assert exc_info.value.extra_data["validation_issues"][0]["type"] == ValidationErrorType.SAVED_ITEM_NOT_FOUND
