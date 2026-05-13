from uuid import uuid4

import pytest
from apiflask.exceptions import HTTPError

from src.services.users.delete_saved_search import delete_saved_search
from src.validation.validation_constants import ValidationErrorType
from tests.src.db.models.factories import UserFactory, UserSavedSearchFactory


def test_delete_saved_search_sets_is_deleted(
    db_session,
    enable_factory_create,
):
    """To test that deleting a saved search soft deletes it"""

    user = UserFactory.create()

    saved_search = UserSavedSearchFactory.create(
        user=user,
        search_query="Sample Query",
        is_deleted=False,
    )
    # Should properly erase saved search data
    delete_saved_search(
        db_session,
        user.user_id,
        saved_search.saved_search_id,
    )

    assert saved_search.is_deleted is True


def test_delete_saved_search_not_found_raises_typed_404(
    db_session,
    enable_factory_create,
):
    """To test that deleting a nonexistent saved search raises typed validation errors"""

    user = UserFactory.create()

    # Should raise error associated with raise_flask_error in delete_saved_search.py
    with pytest.raises(HTTPError) as exc:
        delete_saved_search(
            db_session,
            user.user_id,
            uuid4(),
        )

    assert exc.value.status_code == 404

    validation_issue = exc.value.extra_data["validation_issues"][0]

    assert validation_issue.type == ValidationErrorType.SAVED_ITEM_NOT_FOUND
    assert validation_issue.message == "Saved search not found"
