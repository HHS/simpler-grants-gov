import uuid

import pytest

from src.auth.api_jwt_auth import create_jwt_for_user
from src.constants.lookup_constants import MgmtPrivilege, MgmtResourceType
from tests.db.models.factories import (
    DepartmentFactory,
    MgmtInternalResourceFactory,
    MgmtUserApiKeyFactory,
    MgmtUserFactory,
    SubagencyFactory,
    TeamFactory,
)
from tests.test_utils.auth_test_utils import setup_user_with_roles


@pytest.fixture
def user_and_token(enable_factory_create, db_session, app):
    """Create a user and a valid JWT token for them."""
    user = MgmtUserFactory.create()
    token, _ = create_jwt_for_user(user, db_session)
    db_session.commit()
    return user, token


def _post(client, user_id, token, resource_type, resource_id, privileges):
    return client.post(
        f"v1/users/{user_id}/can_access",
        headers={"X-MGMT-Token": token},
        json={
            "mgmt_resource_type": resource_type,
            "mgmt_resource_id": str(resource_id),
            "mgmt_privileges": privileges,
        },
    )


def test_can_access_direct_grant_200(user_and_token, client, db_session):
    user, token = user_and_token
    team = TeamFactory.create()
    setup_user_with_roles(db_session, [team], user=user, privileges=[MgmtPrivilege.VIEW_TEAM])

    resp = _post(
        client, user.mgmt_user_id, token, MgmtResourceType.TEAM, team.team_id, ["view_team"]
    )

    assert resp.status_code == 200
    assert resp.get_json()["message"] == "Success"


def test_can_access_department_200(user_and_token, client, db_session):
    user, token = user_and_token
    department = DepartmentFactory.create()
    setup_user_with_roles(
        db_session, [department], user=user, privileges=[MgmtPrivilege.VIEW_DEPARTMENT]
    )

    resp = _post(
        client,
        user.mgmt_user_id,
        token,
        MgmtResourceType.DEPARTMENT,
        department.department_id,
        ["view_department"],
    )

    assert resp.status_code == 200


def test_can_access_subagency_200(user_and_token, client, db_session):
    user, token = user_and_token
    subagency = SubagencyFactory.create()
    setup_user_with_roles(
        db_session, [subagency], user=user, privileges=[MgmtPrivilege.VIEW_SUBAGENCY]
    )

    resp = _post(
        client,
        user.mgmt_user_id,
        token,
        MgmtResourceType.SUBAGENCY,
        subagency.subagency_id,
        ["view_subagency"],
    )

    assert resp.status_code == 200


def test_can_access_inherited_from_parent_department_200(user_and_token, client, db_session):
    """A role granted on the parent department should allow access to a team beneath it."""
    user, token = user_and_token
    team = TeamFactory.create()
    department = team.subagency.department

    # Grant the privilege on the department, then check access against the team
    setup_user_with_roles(db_session, [department], user=user, privileges=[MgmtPrivilege.VIEW_TEAM])

    resp = _post(
        client, user.mgmt_user_id, token, MgmtResourceType.TEAM, team.team_id, ["view_team"]
    )

    assert resp.status_code == 200


def test_can_access_multiple_privileges_requires_all_403(user_and_token, client, db_session):
    """When multiple privileges are requested, the user must have all of them."""
    user, token = user_and_token
    team = TeamFactory.create()
    setup_user_with_roles(db_session, [team], user=user, privileges=[MgmtPrivilege.VIEW_TEAM])

    resp = _post(
        client,
        user.mgmt_user_id,
        token,
        MgmtResourceType.TEAM,
        team.team_id,
        ["view_team", "update_team"],
    )

    assert resp.status_code == 403


def test_can_access_missing_privilege_403(user_and_token, client, db_session):
    user, token = user_and_token
    team = TeamFactory.create()
    setup_user_with_roles(db_session, [team], user=user, privileges=[MgmtPrivilege.VIEW_TEAM])

    resp = _post(
        client, user.mgmt_user_id, token, MgmtResourceType.TEAM, team.team_id, ["update_team"]
    )

    assert resp.status_code == 403
    assert resp.get_json()["message"] == "Forbidden"


def test_can_access_no_roles_403(user_and_token, client, db_session):
    """A user with no roles at all against the resource is denied."""
    user, token = user_and_token
    team = TeamFactory.create()

    resp = _post(
        client, user.mgmt_user_id, token, MgmtResourceType.TEAM, team.team_id, ["view_team"]
    )

    assert resp.status_code == 403


def test_can_access_child_grant_does_not_reach_parent_403(user_and_token, client, db_session):
    """A grant on a child team must not authorize access to the parent department."""
    user, token = user_and_token
    team = TeamFactory.create()
    department = team.subagency.department
    setup_user_with_roles(db_session, [team], user=user, privileges=[MgmtPrivilege.VIEW_DEPARTMENT])

    resp = _post(
        client,
        user.mgmt_user_id,
        token,
        MgmtResourceType.DEPARTMENT,
        department.department_id,
        ["view_department"],
    )

    assert resp.status_code == 403


def test_can_access_other_user_403(user_and_token, client, db_session):
    """A user may only check access for their own user ID."""
    user, token = user_and_token
    team = TeamFactory.create()
    setup_user_with_roles(db_session, [team], user=user, privileges=[MgmtPrivilege.VIEW_TEAM])

    other_user_id = uuid.uuid4()
    resp = _post(client, other_user_id, token, MgmtResourceType.TEAM, team.team_id, ["view_team"])

    assert resp.status_code == 403


def test_can_access_resource_not_found_404(user_and_token, client):
    user, token = user_and_token

    resp = _post(
        client, user.mgmt_user_id, token, MgmtResourceType.TEAM, uuid.uuid4(), ["view_team"]
    )

    assert resp.status_code == 404


def test_can_access_resource_type_mismatch_404(user_and_token, client, db_session):
    """A real resource ID checked under the wrong type returns 404, not extra info."""
    user, token = user_and_token
    team = TeamFactory.create()
    setup_user_with_roles(db_session, [team], user=user, privileges=[MgmtPrivilege.VIEW_TEAM])

    # team.team_id is a real resource, but we ask for it as a department
    resp = _post(
        client,
        user.mgmt_user_id,
        token,
        MgmtResourceType.DEPARTMENT,
        team.team_id,
        ["view_department"],
    )

    assert resp.status_code == 404


def test_can_access_unsupported_resource_type_404(user_and_token, client):
    """Resource types without a getter (e.g. opportunity) are not supported yet."""
    user, token = user_and_token

    resp = _post(
        client,
        user.mgmt_user_id,
        token,
        MgmtResourceType.OPPORTUNITY,
        uuid.uuid4(),
        ["view_team"],
    )

    assert resp.status_code == 404


def test_can_access_internal_resource_type_404(user_and_token, client, db_session):
    """The internal resource type is not exposed through this endpoint."""
    user, token = user_and_token
    internal_resource = MgmtInternalResourceFactory.create()

    resp = _post(
        client,
        user.mgmt_user_id,
        token,
        MgmtResourceType.INTERNAL,
        internal_resource.mgmt_internal_resource_id,
        ["view_team"],
    )

    assert resp.status_code == 404


def test_can_access_empty_privileges_422(user_and_token, client, db_session):
    user, token = user_and_token
    team = TeamFactory.create()

    resp = _post(client, user.mgmt_user_id, token, MgmtResourceType.TEAM, team.team_id, [])

    assert resp.status_code == 422


def test_can_access_via_api_key_200(enable_factory_create, client, db_session):
    """The endpoint also authenticates via an API key (X-API-Key)."""
    user = MgmtUserFactory.create()
    api_key = MgmtUserApiKeyFactory.create(mgmt_user=user, key_id="can-access-key", is_active=True)
    team = TeamFactory.create()
    setup_user_with_roles(db_session, [team], user=user, privileges=[MgmtPrivilege.VIEW_TEAM])

    resp = client.post(
        f"v1/users/{user.mgmt_user_id}/can_access",
        headers={"X-API-Key": api_key.key_id},
        json={
            "mgmt_resource_type": MgmtResourceType.TEAM,
            "mgmt_resource_id": str(team.team_id),
            "mgmt_privileges": ["view_team"],
        },
    )

    assert resp.status_code == 200


def test_can_access_via_api_key_other_user_403(enable_factory_create, client, db_session):
    """An API-key-authenticated user may only check access for their own user ID."""
    user = MgmtUserFactory.create()
    api_key = MgmtUserApiKeyFactory.create(
        mgmt_user=user, key_id="can-access-key-2", is_active=True
    )
    team = TeamFactory.create()
    setup_user_with_roles(db_session, [team], user=user, privileges=[MgmtPrivilege.VIEW_TEAM])

    resp = client.post(
        f"v1/users/{uuid.uuid4()}/can_access",
        headers={"X-API-Key": api_key.key_id},
        json={
            "mgmt_resource_type": MgmtResourceType.TEAM,
            "mgmt_resource_id": str(team.team_id),
            "mgmt_privileges": ["view_team"],
        },
    )

    assert resp.status_code == 403


def test_can_access_no_token_401(client, enable_factory_create, db_session):
    team = TeamFactory.create()

    resp = client.post(
        f"v1/users/{uuid.uuid4()}/can_access",
        json={
            "mgmt_resource_type": MgmtResourceType.TEAM,
            "mgmt_resource_id": str(team.team_id),
            "mgmt_privileges": ["view_team"],
        },
    )

    assert resp.status_code == 401
