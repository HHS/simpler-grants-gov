import pytest
from sqlalchemy.exc import IntegrityError

from tests.src.db.models.factories import (
    OrganizationFactory,
    UserFactory,
    UserSavedOpportunityNotificationFactory,
)


class TestUserSavedOpportunityNotification:
    def test_email_enabled_defaults_true_for_user_own_settings(self, enable_factory_create):
        """email_enabled should default to True when organization_id is None (user's own settings)"""
        notification = UserSavedOpportunityNotificationFactory.create(organization=None)
        assert notification.organization_id is None
        assert notification.email_enabled is True

    def test_email_enabled_defaults_false_for_org_settings(self, enable_factory_create):
        """email_enabled should default to False when organization_id is set"""
        org = OrganizationFactory.create()
        notification = UserSavedOpportunityNotificationFactory.create(organization=org)
        assert notification.organization_id == org.organization_id
        assert notification.email_enabled is False

    def test_unique_constraint_null_org(self, enable_factory_create, db_session):
        """Only one row per user allowed when organization_id IS NULL"""
        user = UserFactory.create()
        UserSavedOpportunityNotificationFactory.create(user=user, organization=None)

        with pytest.raises(IntegrityError):
            with db_session.begin():
                UserSavedOpportunityNotificationFactory.create(user=user, organization=None)

    def test_unique_constraint_org_scoped(self, enable_factory_create, db_session):
        """Only one row per (user, org) pair allowed"""
        user = UserFactory.create()
        org = OrganizationFactory.create()
        UserSavedOpportunityNotificationFactory.create(user=user, organization=org)

        with pytest.raises(IntegrityError):
            with db_session.begin():
                UserSavedOpportunityNotificationFactory.create(user=user, organization=org)

    def test_user_can_have_both_own_and_org_settings(self, enable_factory_create):
        """A user can have a null-org row and separate org-scoped rows"""
        user = UserFactory.create()
        org = OrganizationFactory.create()

        own = UserSavedOpportunityNotificationFactory.create(user=user, organization=None)
        org_scoped = UserSavedOpportunityNotificationFactory.create(user=user, organization=org)

        assert own.organization_id is None
        assert org_scoped.organization_id == org.organization_id

    def test_same_org_different_users(self, enable_factory_create):
        """Different users can each have a row for the same org"""
        org = OrganizationFactory.create()
        n1 = UserSavedOpportunityNotificationFactory.create(organization=org)
        n2 = UserSavedOpportunityNotificationFactory.create(organization=org)

        assert n1.user_id != n2.user_id
        assert n1.organization_id == n2.organization_id == org.organization_id
