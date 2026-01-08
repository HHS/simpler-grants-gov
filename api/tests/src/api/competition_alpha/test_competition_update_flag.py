import uuid

import tests.src.db.models.factories as factories
from src.constants.lookup_constants import Privilege


def add_manage_competition_privilege(db_session, user):
    """
    Helper to add the MANAGE_COMPETITION privilege to the user's existing role.
    """
    admin_role = user.internal_user_roles[0].role

    if Privilege.MANAGE_COMPETITION not in admin_role.privileges:
        admin_role.privileges.append(Privilege.MANAGE_COMPETITION)
        db_session.commit()


def test_update_competition_flag_to_true_success(
    client, db_session, internal_admin_user, internal_admin_user_api_key, enable_factory_create
):
    """Test successfully toggling the is_simpler_grants_enabled flag"""
    add_manage_competition_privilege(db_session, internal_admin_user)

    competition = factories.CompetitionFactory.create(is_simpler_grants_enabled=False)
    factories.CompetitionInstructionFactory.create(competition=competition)
    db_session.commit()

    payload = {"is_simpler_grants_enabled": True}
    url = f"/alpha/competitions/{competition.competition_id}/flag"

    resp = client.put(url, headers={"X-API-Key": internal_admin_user_api_key}, json=payload)

    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert data["is_simpler_grants_enabled"] is True


def test_update_competition_flag_to_false_success(
    client, db_session, internal_admin_user, internal_admin_user_api_key, enable_factory_create
):
    """Test successfully toggling the flag from True to False"""
    add_manage_competition_privilege(db_session, internal_admin_user)

    competition = factories.CompetitionFactory.create(is_simpler_grants_enabled=True)
    factories.CompetitionInstructionFactory.create(competition=competition)
    db_session.commit()

    payload = {"is_simpler_grants_enabled": False}
    url = f"/alpha/competitions/{competition.competition_id}/flag"

    resp = client.put(url, headers={"X-API-Key": internal_admin_user_api_key}, json=payload)

    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert data["is_simpler_grants_enabled"] is False

    db_session.refresh(competition)
    assert competition.is_simpler_grants_enabled is False


def test_update_competition_flag_forbidden(client, user_api_key_id, enable_factory_create):
    """Test 403 response when user lacks MANAGE_COMPETITION privilege"""
    competition = factories.CompetitionFactory.create()

    payload = {"is_simpler_grants_enabled": True}
    url = f"/alpha/competitions/{competition.competition_id}/flag"

    resp = client.put(url, headers={"X-API-Key": user_api_key_id}, json=payload)

    assert resp.status_code == 403
    assert resp.get_json()["message"] == "Forbidden"


def test_update_competition_flag_not_found(
    client, db_session, internal_admin_user, internal_admin_user_api_key, enable_factory_create
):
    """Test 404 response for a non-existent competition ID"""
    add_manage_competition_privilege(db_session, internal_admin_user)

    payload = {"is_simpler_grants_enabled": True}
    url = f"/alpha/competitions/{uuid.uuid4()}/flag"

    resp = client.put(url, headers={"X-API-Key": internal_admin_user_api_key}, json=payload)

    assert resp.status_code == 404


def test_update_competition_flag_invalid_payload(
    client, internal_admin_user_api_key, enable_factory_create
):
    """Test 422 response for missing or invalid payload fields"""
    competition = factories.CompetitionFactory.create()

    payload = {"wrong_field": True}
    url = f"/alpha/competitions/{competition.competition_id}/flag"

    resp = client.put(url, headers={"X-API-Key": internal_admin_user_api_key}, json=payload)

    assert resp.status_code == 422
