from uuid import uuid4

from tests.src.api.competition_alpha.test_competition_update_flag import (
    add_manage_competition_privilege,
)
from tests.src.db.models import factories


def test_put_competition_forms_add_success(
    client, db_session, internal_admin_user, internal_admin_user_api_key, enable_factory_create
):
    """Test adding forms to a competition with no existing forms"""
    add_manage_competition_privilege(db_session, internal_admin_user)

    competition = factories.CompetitionFactory.create(competition_forms=[])
    form1 = factories.FormFactory.create()
    form2 = factories.FormFactory.create()

    payload = {
        "forms": [
            {"form_id": str(form1.form_id), "is_required": True},
            {"form_id": str(form2.form_id), "is_required": False},
        ]
    }
    url = f"/alpha/competitions/{competition.competition_id}/forms"
    resp = client.put(url, headers={"X-API-Key": internal_admin_user_api_key}, json=payload)

    assert resp.status_code == 200

    db_session.refresh(competition)
    assert len(competition.competition_forms) == 2


def test_put_competition_forms_update_existing(
    client, db_session, internal_admin_user, internal_admin_user_api_key, enable_factory_create
):
    """Test updating is_required on an existing competition form"""
    add_manage_competition_privilege(db_session, internal_admin_user)

    competition = factories.CompetitionFactory.create(competition_forms=[])
    form = factories.FormFactory.create()

    factories.CompetitionFormFactory.create(
        competition=competition,
        form=form,
        is_required=False,
    )

    payload = {
        "forms": [
            {"form_id": str(form.form_id), "is_required": True},
        ]
    }

    url = f"/alpha/competitions/{competition.competition_id}/forms"
    resp = client.put(url, headers={"X-API-Key": internal_admin_user_api_key}, json=payload)

    assert resp.status_code == 200

    db_session.refresh(competition)
    assert len(competition.competition_forms) == 1
    assert competition.competition_forms[0].is_required is True


def test_put_competition_forms_remove_missing(
    client, db_session, internal_admin_user, internal_admin_user_api_key, enable_factory_create
):
    """Test removing forms not included in the request"""
    add_manage_competition_privilege(db_session, internal_admin_user)

    competition = factories.CompetitionFactory.create(competition_forms=[])
    form1 = factories.FormFactory.create()
    form2 = factories.FormFactory.create()

    factories.CompetitionFormFactory.create(competition=competition, form=form1, is_required=True)
    factories.CompetitionFormFactory.create(competition=competition, form=form2, is_required=True)

    payload = {
        "forms": [
            {"form_id": str(form1.form_id), "is_required": True},
        ]
    }

    url = f"/alpha/competitions/{competition.competition_id}/forms"
    resp = client.put(url, headers={"X-API-Key": internal_admin_user_api_key}, json=payload)

    assert resp.status_code == 200

    db_session.refresh(competition)
    assert len(competition.competition_forms) == 1
    assert competition.competition_forms[0].form_id == form1.form_id


def test_put_competition_forms_competition_not_found(
    client, db_session, internal_admin_user, internal_admin_user_api_key, enable_factory_create
):
    """Test 404 when competition does not exist"""
    add_manage_competition_privilege(db_session, internal_admin_user)

    form = factories.FormFactory.create()

    payload = {
        "forms": [
            {"form_id": str(form.form_id), "is_required": True},
        ]
    }

    url = f"/alpha/competitions/{uuid4()}/forms"
    resp = client.put(url, headers={"X-API-Key": internal_admin_user_api_key}, json=payload)

    assert resp.status_code == 404


def test_put_competition_forms_form_not_found(
    client, db_session, internal_admin_user, internal_admin_user_api_key, enable_factory_create
):
    """Test 404 when one of multiple requested forms does not exist"""
    add_manage_competition_privilege(db_session, internal_admin_user)

    competition = factories.CompetitionFactory.create(competition_forms=[])
    existing_form = factories.FormFactory.create()
    db_session.commit()

    payload = {
        "forms": [
            {"form_id": str(existing_form.form_id), "is_required": True},
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
