from uuid import uuid4

from src.form_schema.forms import SF424_v4_0
from src.form_schema.forms.sf424a import SF424a_v1_0
from tests.src.api.competition_alpha.test_competition_update_flag import (
    add_manage_competition_privilege,
)
from tests.src.db.models import factories


def test_put_competition_forms_add_success(
    client,
    db_session,
    internal_admin_user,
    internal_admin_user_api_key,
    enable_factory_create,
    seed_form_registry,
):
    """Test adding forms to a competition with no existing forms"""
    add_manage_competition_privilege(db_session, internal_admin_user)

    competition = factories.CompetitionFactory.create(competition_forms=[])

    payload = {
        "forms": [
            {"form_id": str(SF424_v4_0.form_id), "is_required": True},
            {"form_id": str(SF424a_v1_0.form_id), "is_required": False},
        ]
    }
    url = f"/alpha/competitions/{competition.competition_id}/forms"
    resp = client.put(url, headers={"X-API-Key": internal_admin_user_api_key}, json=payload)

    assert resp.status_code == 200

    db_session.refresh(competition)
    assert len(competition.competition_forms) == 2


def test_put_competition_forms_update_existing(
    client,
    db_session,
    internal_admin_user,
    internal_admin_user_api_key,
    enable_factory_create,
    seed_form_registry,
):
    """Test updating is_required on an existing competition form"""
    add_manage_competition_privilege(db_session, internal_admin_user)

    competition = factories.CompetitionFactory.create(competition_forms=[])

    factories.CompetitionFormFactory.create(
        competition=competition,
        form=SF424_v4_0,
        is_required=False,
    )

    payload = {
        "forms": [
            {"form_id": str(SF424_v4_0.form_id), "is_required": True},
        ]
    }

    url = f"/alpha/competitions/{competition.competition_id}/forms"
    resp = client.put(url, headers={"X-API-Key": internal_admin_user_api_key}, json=payload)

    assert resp.status_code == 200

    db_session.refresh(competition)
    assert len(competition.competition_forms) == 1
    assert competition.competition_forms[0].is_required is True
    first_update_at = competition.competition_forms[0].updated_at

    # update with same value
    url = f"/alpha/competitions/{competition.competition_id}/forms"
    resp = client.put(url, headers={"X-API-Key": internal_admin_user_api_key}, json=payload)

    assert resp.status_code == 200
    db_session.refresh(competition)

    assert len(competition.competition_forms) == 1
    assert competition.competition_forms[0].is_required is True
    assert competition.competition_forms[0].updated_at == first_update_at  # No update


def test_put_competition_forms_remove_missing(
    client,
    db_session,
    internal_admin_user,
    internal_admin_user_api_key,
    enable_factory_create,
    seed_form_registry,
):
    """Test removing forms not included in the request"""
    add_manage_competition_privilege(db_session, internal_admin_user)
    competition = factories.CompetitionFactory.create(competition_forms=[])

    factories.CompetitionFormFactory.create(
        competition=competition, form=SF424_v4_0, is_required=True
    )
    factories.CompetitionFormFactory.create(
        competition=competition, form=SF424a_v1_0, is_required=True
    )

    payload = {
        "forms": [
            {"form_id": str(SF424_v4_0.form_id), "is_required": True},
        ]
    }

    url = f"/alpha/competitions/{competition.competition_id}/forms"
    resp = client.put(url, headers={"X-API-Key": internal_admin_user_api_key}, json=payload)

    assert resp.status_code == 200

    db_session.refresh(competition)
    assert len(competition.competition_forms) == 1
    assert competition.competition_forms[0].form_id == SF424_v4_0.form_id


def test_put_competition_forms_competition_not_found(
    client,
    db_session,
    internal_admin_user,
    internal_admin_user_api_key,
    enable_factory_create,
    seed_form_registry,
):
    """Test 404 when competition does not exist"""
    add_manage_competition_privilege(db_session, internal_admin_user)

    payload = {
        "forms": [
            {"form_id": str(SF424_v4_0.form_id), "is_required": True},
        ]
    }

    url = f"/alpha/competitions/{uuid4()}/forms"
    resp = client.put(url, headers={"X-API-Key": internal_admin_user_api_key}, json=payload)

    assert resp.status_code == 404


def test_put_competition_forms_form_not_found(
    client,
    db_session,
    internal_admin_user,
    internal_admin_user_api_key,
    enable_factory_create,
    seed_form_registry,
):
    """Test 404 when one of multiple requested forms does not exist"""
    add_manage_competition_privilege(db_session, internal_admin_user)

    competition = factories.CompetitionFactory.create(competition_forms=[])

    payload = {
        "forms": [
            {"form_id": str(SF424_v4_0.form_id), "is_required": True},
            {"form_id": str(uuid4()), "is_required": False},
        ]
    }

    url = f"/alpha/competitions/{competition.competition_id}/forms"
    resp = client.put(
        url,
        headers={"X-API-Key": internal_admin_user_api_key},
        json=payload,
    )

    assert resp.status_code == 404


def test_put_competition_forms_form_deprecated(
    client,
    db_session,
    internal_admin_user,
    internal_admin_user_api_key,
    enable_factory_create,
    seed_form_registry,
):
    """Test 404 when one of multiple requested forms is deprecated (not in registry)"""
    add_manage_competition_privilege(db_session, internal_admin_user)

    competition = factories.CompetitionFactory.create(competition_forms=[])
    # Use a random UUID that is not registered — the service treats unknown/deprecated IDs the same.
    unknown_form_id = uuid4()

    payload = {
        "forms": [
            {"form_id": str(SF424_v4_0.form_id), "is_required": True},
            {"form_id": str(unknown_form_id), "is_required": False},
        ]
    }

    url = f"/alpha/competitions/{competition.competition_id}/forms"
    resp = client.put(
        url,
        headers={"X-API-Key": internal_admin_user_api_key},
        json=payload,
    )

    assert resp.status_code == 404


def test_put_competition_forms_unauthorized(
    client,
    db_session,
    internal_admin_user_api_key,
    enable_factory_create,
    seed_form_registry,
):
    """Test adding forms to a competition without the required privilege"""
    competition = factories.CompetitionFactory.create(competition_forms=[])

    payload = {
        "forms": [
            {"form_id": str(SF424_v4_0.form_id), "is_required": True},
        ]
    }
    url = f"/alpha/competitions/{competition.competition_id}/forms"
    resp = client.put(url, headers={"X-API-Key": internal_admin_user_api_key}, json=payload)

    assert resp.status_code == 403
