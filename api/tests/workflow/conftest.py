import pytest

from src.constants.lookup_constants import Privilege, RoleType
from tests.src.db.models.factories import (
    InternalUserRoleFactory,
    RoleFactory,
    UserFactory,
    UserProfileFactory,
)


@pytest.fixture
def workflow_user(enable_factory_create, monkeypatch):
    """Get the workflow user, setting them up with expected params

    Also sets the workflow user ID env var to the user created here.
    """
    user = UserFactory.create()
    UserProfileFactory.create(user=user, first_name="System", last_name="User")

    role = RoleFactory.create(
        privileges=[Privilege.INTERNAL_WORKFLOW_ACCESS], role_types=[RoleType.INTERNAL]
    )
    InternalUserRoleFactory.create(user=user, role=role)

    monkeypatch.setenv("WORKFLOW_SERVICE_INTERNAL_USER_ID", str(user.user_id))

    return user
