import uuid

import apiflask.exceptions
import pytest
from grants_shared.adapters import db
from sqlalchemy import select

import tests.src.db.models.factories as factories
from src.db.models.user_models import UserSavedOpportunity
from src.services.users.delete_saved_opportunity import delete_saved_opportunity
from src.validation.validation_constants import ValidationErrorType


def test_delete_saved_opportunity_success(enable_factory_create, db_session: db.Session):
    user = factories.UserFactory.create()
    opportunity = factories.OpportunityFactory.create()
    saved_opp = factories.UserSavedOpportunityFactory.create(
        user=user, opportunity=opportunity, is_deleted=False
    )

    delete_saved_opportunity(db_session, user.user_id, opportunity.opportunity_id)

    result = db_session.execute(
        select(UserSavedOpportunity).where(
            UserSavedOpportunity.user_id == user.user_id,
            UserSavedOpportunity.opportunity_id == opportunity.opportunity_id,
        )
    ).scalar_one_or_none()
    assert result is not None
    assert result.is_deleted is True


def test_delete_saved_opportunity_not_found(enable_factory_create, db_session: db.Session):
    user = factories.UserFactory.create()
    nonexistent_id = uuid.uuid4()

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        delete_saved_opportunity(db_session, user.user_id, nonexistent_id)

    assert exc_info.value.status_code == 404
    assert exc_info.value.extra_data["validation_issues"][0]["type"] == ValidationErrorType.SAVED_ITEM_NOT_FOUND


def test_delete_saved_opportunity_wrong_user(enable_factory_create, db_session: db.Session):
    user1 = factories.UserFactory.create()
    user2 = factories.UserFactory.create()
    opportunity = factories.OpportunityFactory.create()
    factories.UserSavedOpportunityFactory.create(
        user=user1, opportunity=opportunity, is_deleted=False
    )

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        delete_saved_opportunity(db_session, user2.user_id, opportunity.opportunity_id)

    assert exc_info.value.status_code == 404
    assert exc_info.value.extra_data["validation_issues"][0]["type"] == ValidationErrorType.SAVED_ITEM_NOT_FOUND
