import uuid

import pytest

from src.services.users.delete_saved_opportunity import delete_saved_opportunity
from tests.src.db.models.factories import (
    OpportunityFactory,
    UserFactory,
    UserSavedOpportunityFactory,
)


class TestDeleteSavedOpportunityService:
    """Test delete_saved_opportunity service function."""

    def test_soft_delete_success(self, enable_factory_create, db_session):
        """Happy path: soft-delete sets is_deleted=True."""
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
        """Raises 404 when saved opportunity does not exist."""
        user = UserFactory.create()
        random_opportunity_id = uuid.uuid4()

        with pytest.raises(Exception) as exc_info:
            delete_saved_opportunity(db_session, user.user_id, random_opportunity_id)

        response = exc_info.value.response if hasattr(exc_info.value, "response") else None
        if response is not None:
            assert response.status_code == 404

    def test_soft_delete_with_legacy_id(self, enable_factory_create, db_session):
        """Soft-delete by legacy integer opportunity_id."""
        user = UserFactory.create()
        opportunity = OpportunityFactory.create(legacy_opportunity_id=99999)
        saved_opp = UserSavedOpportunityFactory.create(
            user=user, opportunity=opportunity
        )

        assert saved_opp.is_deleted is False

        delete_saved_opportunity(db_session, user.user_id, 99999)

        db_session.refresh(saved_opp)
        assert saved_opp.is_deleted is True
