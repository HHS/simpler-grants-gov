import apiflask.exceptions
import pytest

from src.adapters import db
from src.constants.lookup_constants import Privilege
from src.services.organizations_v1.get_organization import get_organization_and_verify_access
from tests.lib.organization_test_utils import create_user_in_org


@pytest.mark.parametrize(
    "user_privileges, call_privileges, expected_status",
    [
        # VIEW is always required — user with VIEW and no extra arg succeeds
        ([Privilege.VIEW_ORG_MEMBERSHIP], None, 200),
        # Both VIEW and MANAGE required — user with both succeeds
        ([Privilege.VIEW_ORG_MEMBERSHIP, Privilege.MANAGE_ORG_MEMBERS], {Privilege.MANAGE_ORG_MEMBERS}, 200),
        # MANAGE-only user fails the base VIEW check
        ([Privilege.MANAGE_ORG_MEMBERS], None, 403),
        # VIEW-only user fails the additional MANAGE check
        ([Privilege.VIEW_ORG_MEMBERSHIP], {Privilege.MANAGE_ORG_MEMBERS}, 403),
    ],
)
def test_get_organization_and_verify_access_privileges(
    enable_factory_create,
    db_session: db.Session,
    user_privileges,
    call_privileges,
    expected_status,
):
    """Unified function always enforces VIEW_ORG_MEMBERSHIP and optionally a second privilege."""
    user, org, _ = create_user_in_org(privileges=user_privileges, db_session=db_session)

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
