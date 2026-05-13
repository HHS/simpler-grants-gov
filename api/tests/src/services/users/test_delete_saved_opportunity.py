from uuid import uuid4

import pytest
from apiflask.exceptions import HTTPError

from src.services.users.delete_saved_opportunity import delete_saved_opportunity
from src.validation.validation_constants import ValidationErrorType
from tests.src.db.models.factories import (
    OpportunityFactory,
    UserFactory,
    UserSavedOpportunityFactory,
)


def test_delete_saved_opportunity_sets_is_deleted(
    db_session,
    enable_factory_create,
):
    """Test that deleting a saved opportunity soft deletes it"""

    user = UserFactory.create()
    opportunity = OpportunityFactory.create()

    saved_opp = UserSavedOpportunityFactory.create(
        user=user,
        opportunity=opportunity,
        is_deleted=False,
    )
    
    # Should properly erase saved opportunity data
    delete_saved_opportunity(
        db_session,
        user.user_id,
        opportunity.opportunity_id,
    )

    assert saved_opp.is_deleted is True


def test_delete_saved_opportunity_not_found_raises_typed_404(
    db_session,
    enable_factory_create,
):
    """Test that deleting a nonexistent saved opportunity raises typed validation errors"""

    user = UserFactory.create()

    # Should raise error associated with raise_flask_error
    with pytest.raises(HTTPError) as exc:
        delete_saved_opportunity(
            db_session,
            user.user_id,
            uuid4(),
        )

    assert exc.value.status_code == 404

    validation_issue = exc.value.extra_data["validation_issues"][0]

    assert validation_issue.type == ValidationErrorType.SAVED_ITEM_NOT_FOUND
    assert validation_issue.message == "Saved opportunity not found"
