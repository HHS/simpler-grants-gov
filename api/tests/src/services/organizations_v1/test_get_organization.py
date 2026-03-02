import apiflask.exceptions
import pytest

from src.adapters import db
from src.constants.lookup_constants import Privilege
from src.services.organizations_v1.get_organization import get_organization_and_verify_access
from tests.src.db.models.factories import (
    OrganizationFactory,
    OrganizationUserFactory,
    OrganizationUserRoleFactory,
    RoleFactory,
    UserFactory,
)


def _make_user_in_org(privileges):
    user = UserFactory.create()
    org = OrganizationFactory.create()
    role = RoleFactory.create(privileges=privileges, is_org_role=True)
    org_user = OrganizationUserFactory.create(user=user, organization=org)
    OrganizationUserRoleFactory.create(organization_user=org_user, role=role)
    return user, org


@pytest.mark.parametrize(
    "user_privilege, call_privileges, expected_status",
    [
        (Privilege.VIEW_ORG_MEMBERSHIP, None, 200),
        (Privilege.MANAGE_ORG_MEMBERS, {Privilege.MANAGE_ORG_MEMBERS}, 200),
        (Privilege.MANAGE_ORG_MEMBERS, None, 403),
        (Privilege.VIEW_ORG_MEMBERSHIP, {Privilege.MANAGE_ORG_MEMBERS}, 403),
    ],
)
def test_get_organization_and_verify_access_privileges(
    enable_factory_create,
    db_session: db.Session,
    user_privilege,
    call_privileges,
    expected_status,
):
    user, org = _make_user_in_org([user_privilege])

    if expected_status == 200:
        result = get_organization_and_verify_access(
            db_session, user, org.organization_id, privileges=call_privileges
        )
        assert result.organization_id == org.organization_id
    else:
        with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
            get_organization_and_verify_access(
                db_session, user, org.organization_id, privileges=call_privileges
            )
        assert exc_info.value.status_code == expected_status
