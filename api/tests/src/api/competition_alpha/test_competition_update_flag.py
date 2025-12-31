import uuid

from sqlalchemy import select

import tests.src.db.models.factories as factories
from src.constants.lookup_constants import Privilege, RoleType
from src.db.models.user_models import UserApiKey


def setup_admin_privileges(db_session, api_key_value):
    """
    Ensures the user associated with the API key has the MANAGE_COMPETITION privilege.
    """
    existing_key = db_session.execute(
        select(UserApiKey).where(UserApiKey.key_id == api_key_value)
    ).scalar_one_or_none()

    if existing_key:
        user = existing_key.user
    else:
        user = factories.UserFactory.create()
        factories.UserApiKeyFactory.create(user=user, key_id=api_key_value)

    admin_role = factories.RoleFactory.create(
        role_name=f"Competition Manager {uuid.uuid4()}", privileges=[Privilege.MANAGE_COMPETITION]
    )
    factories.LinkRoleRoleTypeFactory.create(role=admin_role, role_type=RoleType.INTERNAL)
    factories.InternalUserRoleFactory.create(user=user, role=admin_role)

    db_session.commit()
    return user


def test_update_competition_flag_success(
    client, db_session, internal_admin_user_api_key, enable_factory_create
):
    """Test successfully toggling the is_simpler_grants_enabled flag"""
    setup_admin_privileges(db_session, internal_admin_user_api_key)

    competition = factories.CompetitionFactory.create(is_simpler_grants_enabled=False)
    factories.CompetitionInstructionFactory.create(competition=competition)
    db_session.commit()

    payload = {"is_simpler_grants_enabled": True}
    url = f"/alpha/competitions/{competition.competition_id}/flag"

    resp = client.put(url, headers={"X-API-Key": internal_admin_user_api_key}, json=payload)

    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert data["is_simpler_grants_enabled"] is True


def test_update_competition_flag_forbidden(
    client, db_session, user_api_key_id, enable_factory_create
):
    """Test 403 response when user lacks MANAGE_COMPETITION privilege"""
    competition = factories.CompetitionFactory.create()
    db_session.commit()

    payload = {"is_simpler_grants_enabled": True}
    url = f"/alpha/competitions/{competition.competition_id}/flag"

    resp = client.put(url, headers={"X-API-Key": user_api_key_id}, json=payload)

    assert resp.status_code == 403
    assert resp.get_json()["message"] == "Forbidden"


def test_update_competition_flag_not_found(
    client, db_session, internal_admin_user_api_key, enable_factory_create
):
    """Test 404 response for a non-existent competition ID"""
    setup_admin_privileges(db_session, internal_admin_user_api_key)

    payload = {"is_simpler_grants_enabled": True}
    url = f"/alpha/competitions/{uuid.uuid4()}/flag"

    resp = client.put(url, headers={"X-API-Key": internal_admin_user_api_key}, json=payload)

    assert resp.status_code == 404


def test_update_competition_flag_invalid_payload(
    client, db_session, internal_admin_user_api_key, enable_factory_create
):
    """Test 422 response for missing or invalid payload fields"""
    setup_admin_privileges(db_session, internal_admin_user_api_key)
    competition = factories.CompetitionFactory.create()
    db_session.commit()

    payload = {"wrong_field": True}
    url = f"/alpha/competitions/{competition.competition_id}/flag"

    resp = client.put(url, headers={"X-API-Key": internal_admin_user_api_key}, json=payload)

    assert resp.status_code == 422
