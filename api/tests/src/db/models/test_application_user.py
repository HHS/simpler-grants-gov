import uuid

import pytest
from sqlalchemy.exc import IntegrityError

from src.db.models.user_models import ApplicationUser
from tests.src.db.models.factories import ApplicationFactory, ApplicationUserFactory, UserFactory


class TestApplicationUser:
    def test_application_user_has_dedicated_primary_key(self, enable_factory_create):
        """Test that ApplicationUser has a dedicated application_user_id primary key"""
        user = UserFactory.create()
        application = ApplicationFactory.create()

        application_user = ApplicationUserFactory.create(
            user=user, application=application
        )

        # Verify the dedicated primary key exists and is a UUID
        assert application_user.application_user_id is not None
        assert isinstance(application_user.application_user_id, uuid.UUID)

        # Verify the foreign keys are set correctly
        assert application_user.application_id == application.application_id
        assert application_user.user_id == user.user_id

        # Verify relationships work correctly
        assert application_user.application == application
        assert application_user.user == user

    def test_application_user_unique_constraint(self, enable_factory_create, db_session):
        """Test that the unique constraint on (application_id, user_id) is enforced"""
        user = UserFactory.create()
        application = ApplicationFactory.create()

        # Create first ApplicationUser
        ApplicationUserFactory.create(user=user, application=application)

        # Attempt to create a duplicate should fail due to unique constraint
        with pytest.raises(IntegrityError):
            with db_session.begin():
                ApplicationUserFactory.create(user=user, application=application)

    def test_application_user_different_users_same_application(self, enable_factory_create):
        """Test that different users can be associated with the same application"""
        user1 = UserFactory.create()
        user2 = UserFactory.create()
        application = ApplicationFactory.create()

        app_user1 = ApplicationUserFactory.create(
            user=user1, application=application
        )
        app_user2 = ApplicationUserFactory.create(
            user=user2, application=application
        )

        # Both should have different primary keys
        assert app_user1.application_user_id != app_user2.application_user_id

        # But same application
        assert app_user1.application_id == app_user2.application_id == application.application_id

        # Different users
        assert app_user1.user_id != app_user2.user_id

    def test_application_user_same_user_different_applications(self, enable_factory_create):
        """Test that the same user can be associated with different applications"""
        user = UserFactory.create()
        application1 = ApplicationFactory.create()
        application2 = ApplicationFactory.create()

        app_user1 = ApplicationUserFactory.create(
            user=user, application=application1
        )
        app_user2 = ApplicationUserFactory.create(
            user=user, application=application2
        )

        # Both should have different primary keys
        assert app_user1.application_user_id != app_user2.application_user_id

        # Different applications
        assert app_user1.application_id != app_user2.application_id

        # But same user
        assert app_user1.user_id == app_user2.user_id == user.user_id

    def test_application_user_table_structure(self):
        """Test that the ApplicationUser table has the expected structure"""
        # Verify the table name
        assert ApplicationUser.__tablename__ == "application_user"

        # Verify primary key
        primary_keys = [col.name for col in ApplicationUser.__table__.primary_key]
        assert primary_keys == ["application_user_id"]

        # Verify unique constraint exists on (application_id, user_id)
        unique_constraints = ApplicationUser.__table__.constraints
        unique_constraint_found = False

        for constraint in unique_constraints:
            if hasattr(constraint, "columns") and len(constraint.columns) == 2:
                column_names = [col.name for col in constraint.columns]
                if "application_id" in column_names and "user_id" in column_names:
                    unique_constraint_found = True
                    break

        assert unique_constraint_found, "Unique constraint on (application_id, user_id) not found"

        # Verify expected columns exist
        column_names = [col.name for col in ApplicationUser.__table__.columns]
        expected_columns = [
            "application_user_id",
            "application_id",
            "user_id",
            "created_at",
            "updated_at",
        ]

        for expected_col in expected_columns:
            assert expected_col in column_names, f"Expected column '{expected_col}' not found"

    def test_application_user_factory_generates_uuid(self, enable_factory_create):
        """Test that the ApplicationUserFactory properly generates UUIDs for the primary key"""
        app_user1 = ApplicationUserFactory.create()
        app_user2 = ApplicationUserFactory.create()

        # Both should have valid UUIDs as primary keys
        assert isinstance(app_user1.application_user_id, uuid.UUID)
        assert isinstance(app_user2.application_user_id, uuid.UUID)

        # UUIDs should be different
        assert app_user1.application_user_id != app_user2.application_user_id
