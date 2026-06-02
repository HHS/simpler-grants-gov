import uuid

import apiflask.exceptions
import pytest
from grants_shared.adapters import db
from sqlalchemy import select

from src.api.response import ValidationErrorDetail
from src.db.models.user_models import UserSavedOpportunity
from src.services.users.delete_saved_opportunity import delete_saved_opportunity
from src.validation.validation_constants import ValidationErrorType
from tests.src.db.models.factories import (
    OpportunityFactory,
    UserFactory,
    UserSavedOpportunityFactory,
)


def test_delete_saved_opportunity_success(enable_factory_create, db_session: db.Session):
    """Test that delete_saved_opportunity soft-deletes by setting is_deleted=True."""
    user = UserFactory.create()
    opportunity = OpportunityFactory.create()
    saved_opp = UserSavedOpportunityFactory.create(
        user=user, opportunity=opportunity, is_deleted=False
    )

    delete_saved_opportunity(db_session, user.user_id, opportunity.opportunity_id)

    # Refresh from DB and verify soft delete
    db_session.expire_all()
    result = db_session.execute(
        select(UserSavedOpportunity).where(
            UserSavedOpportunity.user_id == saved_opp.user_id,
            UserSavedOpportunity.opportunity_id == saved_opp.opportunity_id,
        )
    ).scalar_one_or_none()

    assert result is not None
    assert result.is_deleted is True


def test_delete_saved_opportunity_not_found(enable_factory_create, db_session: db.Session):
    """Test that delete_saved_opportunity raises 404 with ValidationErrorDetail when opportunity not found."""
    user = UserFactory.create()
    nonexistent_id = uuid.uuid4()

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        delete_saved_opportunity(db_session, user.user_id, nonexistent_id)

    assert exc_info.value.status_code == 404
    assert "Saved opportunity not found" in exc_info.value.message

    # Verify the validation_issues payload contains a properly typed ValidationErrorDetail
    validation_issues = exc_info.value.extra_data.get("validation_issues", [])
    assert len(validation_issues) == 1
    issue = validation_issues[0]
    assert isinstance(issue, ValidationErrorDetail)
    assert issue.type == ValidationErrorType.SAVED_ITEM_NOT_FOUND
    assert issue.message == "Saved opportunity not found"


def test_delete_saved_opportunity_wrong_user(enable_factory_create, db_session: db.Session):
    """Test that delete_saved_opportunity raises 404 when saved opportunity belongs to a different user."""
    user1 = UserFactory.create()
    user2 = UserFactory.create()
    opportunity = OpportunityFactory.create()
    UserSavedOpportunityFactory.create(user=user1, opportunity=opportunity, is_deleted=False)

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        delete_saved_opportunity(db_session, user2.user_id, opportunity.opportunity_id)

    assert exc_info.value.status_code == 404

    # Verify the original was NOT deleted
    db_session.expire_all()
    result = db_session.execute(
        select(UserSavedOpportunity).where(
            UserSavedOpportunity.user_id == user1.user_id,
            UserSavedOpportunity.opportunity_id == opportunity.opportunity_id,
        )
    ).scalar_one_or_none()

    assert result is not None
    assert result.is_deleted is False


def test_delete_saved_opportunity_legacy_id(enable_factory_create, db_session: db.Session):
    """Test that delete_saved_opportunity works with legacy (integer) opportunity IDs."""
    user = UserFactory.create()
    opportunity = OpportunityFactory.create()
    saved_opp = UserSavedOpportunityFactory.create(
        user=user, opportunity=opportunity, is_deleted=False
    )

    delete_saved_opportunity(db_session, user.user_id, opportunity.legacy_opportunity_id)

    # Verify soft delete via UUID path
    db_session.expire_all()
    result = db_session.execute(
        select(UserSavedOpportunity).where(
            UserSavedOpportunity.user_id == saved_opp.user_id,
            UserSavedOpportunity.opportunity_id == saved_opp.opportunity_id,
        )
    ).scalar_one_or_none()

    assert result is not None
    assert result.is_deleted is True


def test_delete_saved_opportunity_legacy_id_not_found(enable_factory_create, db_session: db.Session):
    """Test that delete_saved_opportunity raises 404 with ValidationErrorDetail for nonexistent legacy ID."""
    user = UserFactory.create()
    nonexistent_legacy_id = 99999999

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        delete_saved_opportunity(db_session, user.user_id, nonexistent_legacy_id)

    assert exc_info.value.status_code == 404
    assert "Saved opportunity not found" in exc_info.value.message

    # Verify structured error payload
    validation_issues = exc_info.value.extra_data.get("validation_issues", [])
    assert len(validation_issues) == 1
    issue = validation_issues[0]
    assert isinstance(issue, ValidationErrorDetail)
    assert issue.type == ValidationErrorType.SAVED_ITEM_NOT_FOUND