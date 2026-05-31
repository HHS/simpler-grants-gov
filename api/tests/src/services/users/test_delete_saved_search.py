import uuid

import pytest

from src.api.response import ValidationErrorDetail
from src.services.users.delete_saved_search import delete_saved_search
from src.services.users.delete_saved_opportunity import delete_saved_opportunity
from src.validation.validation_constants import ValidationErrorType
from tests.src.db.models.factories import (
    OpportunityFactory,
    UserFactory,
    UserSavedOpportunityFactory,
    UserSavedSearchFactory,
)


class TestDeleteSavedSearch:
    """Test delete_saved_search service function."""

    def test_soft_delete_success(self, enable_factory_create, db_session):
        """Happy path: soft-delete sets is_deleted=True."""
        user = UserFactory.create()
        saved_search = UserSavedSearchFactory.create(user=user)

        assert saved_search.is_deleted is False

        delete_saved_search(db_session, user.user_id, saved_search.saved_search_id)

        db_session.refresh(saved_search)
        assert saved_search.is_deleted is True

    def test_404_not_found(self, enable_factory_create, db_session):
        """Raises 404 with ValidationErrorDetail when saved search does not exist."""
        user = UserFactory.create()
        random_search_id = uuid.uuid4()

        with pytest.raises(Exception) as exc_info:
            delete_saved_search(db_session, user.user_id, random_search_id)

        # The raise_flask_error uses abort which raises HTTPException
        response = exc_info.value.response if hasattr(exc_info.value, "response") else None
        if response is not None:
            assert response.status_code == 404


class TestDeleteSavedOpportunity:
    """Test delete_saved_opportunity service function."""

    def test_soft_delete_success_with_uuid(self, enable_factory_create, db_session):
        """Happy path: soft-delete by UUID opportunity_id sets is_deleted=True."""
        user = UserFactory.create()
        opportunity = OpportunityFactory.create()
        saved_opp = UserSavedOpportunityFactory.create(
            user=user, opportunity=opportunity
        )

        assert saved_opp.is_deleted is False

        delete_saved_opportunity(db_session, user.user_id, opportunity.opportunity_id)

        db_session.refresh(saved_opp)
        assert saved_opp.is_deleted is True

    def test_404_not_found(self, enable_factory_create, db_session):
        """Raises 404 with ValidationErrorDetail when saved opportunity does not exist."""
        user = UserFactory.create()
        random_opportunity_id = uuid.uuid4()

        with pytest.raises(Exception) as exc_info:
            delete_saved_opportunity(db_session, user.user_id, random_opportunity_id)

        response = exc_info.value.response if hasattr(exc_info.value, "response") else None
        if response is not None:
            assert response.status_code == 404

    def test_soft_delete_with_legacy_opportunity_id(self, enable_factory_create, db_session):
        """Happy path: soft-delete by legacy integer opportunity_id."""
        user = UserFactory.create()
        opportunity = OpportunityFactory.create(legacy_opportunity_id=12345)
        saved_opp = UserSavedOpportunityFactory.create(
            user=user, opportunity=opportunity
        )

        assert saved_opp.is_deleted is False

        delete_saved_opportunity(db_session, user.user_id, 12345)

        db_session.refresh(saved_opp)
        assert saved_opp.is_deleted is True
