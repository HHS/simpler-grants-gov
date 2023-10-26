from datetime import date, datetime

import pytest

import src.adapters.db as db
from src.db.models.user_models import User
from tests.src.db.models.factories import RoleFactory, UserFactory

user_params = {
    "first_name": "Alvin",
    "middle_name": "Bob",
    "last_name": "Chester",
    "phone_number": "999-999-9999",
    "date_of_birth": date(2022, 1, 1),
    "is_active": False,
}


def validate_user_record(user: User, user_expected_values=None):
    if user_expected_values:
        assert user.id is not None
        for k, v in user_expected_values.items():
            user_v = getattr(user, k)
            if k == "roles":
                user_role_ids = set([role.role_id for role in user_v])
                expected_role_ids = set([role.role_id for role in v])
                assert user_role_ids == expected_role_ids
            else:
                if isinstance(user_v, datetime):
                    user_v = user_v.isoformat()

                assert str(user_v) == str(v)

    else:
        # Otherwise just validate the values are set
        assert user.id is not None
        assert user.first_name is not None
        assert user.last_name is not None
        assert user.phone_number is not None
        assert user.date_of_birth is not None
        assert user.is_active is not None
        assert user.roles is not None


def test_user_factory_build():
    # Build doesn't use the DB

    # Build sets the values
    user = UserFactory.build()
    validate_user_record(user)

    user = UserFactory.build(**user_params)
    validate_user_record(user, user_params)


def test_factory_create_uninitialized_db_session():
    # DB factory access is disabled from tests unless you add the
    # 'enable_factory_create' fixture.
    with pytest.raises(Exception, match="Factory db_session is not initialized."):
        UserFactory.create()


def test_user_factory_create(enable_factory_create, db_session: db.Session):
    # Delete any users created by other tests
    db_session.query(User).delete()

    # Create actually writes a record to the DB when run
    # so we'll check the DB directly as well.
    user = UserFactory.create()
    validate_user_record(user)

    db_record = db_session.query(User).filter(User.id == user.id).one_or_none()
    # Make certain the DB record matches the factory one.
    validate_user_record(db_record, user.for_json())

    user = UserFactory.create(**user_params)
    validate_user_record(user, user_params)

    db_record = db_session.query(User).filter(User.id == user.id).one_or_none()
    # Make certain the DB record matches the factory one.
    validate_user_record(db_record, db_record.for_json())

    # Make certain nullable fields can be overriden
    null_params = {"middle_name": None}
    user = UserFactory.create(**null_params)
    validate_user_record(user, null_params)

    all_db_records = db_session.query(User).all()
    assert len(all_db_records) == 3


def test_role_factory_create(enable_factory_create):
    # Verify if you build a Role directly, it gets
    # a user attached to it with that single role
    role = RoleFactory.create()
    assert role.user is not None
    assert len(role.user.roles) == 1
