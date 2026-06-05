from uuid import uuid4

from src.db.models.competition_models import Form
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
    form1 = db_session.get(Form, SF424_v4_0.form_id)
    form2 = db_session.get(Form, SF424a_v1_0.form_id)

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
    form = db_session.get(Form, SF424_v4_0.form_id)

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
    form1 = db_session.get(Form, SF424_v4_0.form_id)
    form2 = db_session.get(Form, SF424a_v1_0.form_id)

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
    client,
    db_session,
    internal_admin_user,
    internal_admin_user_api_key,
    enable_factory_create,
    seed_form_registry,
):
    """Test 404 when competition does not exist"""
    add_manage_competition_privilege(db_session, internal_admin_user)

    form = db_session.get(Form, SF424_v4_0.form_id)

    payload = {
        "forms": [
            {"form_id": str(form.form_id), "is_required": True},
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
    existing_form = db_session.get(Form, SF424_v4_0.form_id)

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


def test_put_competition_forms_form_deprecated(
    client,
    db_session,
    internal_admin_user,
    internal_admin_user_api_key,
    enable_factory_create,
    seed_form_registry,
):
    """Test 404 when one of multiple requested forms is deprecated"""
    add_manage_competition_privilege(db_session, internal_admin_user)

    competition = factories.CompetitionFactory.create(competition_forms=[])
    existing_form = db_session.get(Form, SF424_v4_0.form_id)
    deprecated_form = factories.FormFactory.create(
        form_name="Deprecated Form",
        short_form_name="DEPR_1_0",
        is_deprecated=True,
    )

    payload = {
        "forms": [
            {"form_id": str(existing_form.form_id), "is_required": True},
            {"form_id": deprecated_form.form_id, "is_required": False},
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
    form1 = db_session.get(Form, SF424_v4_0.form_id)

    payload = {
        "forms": [
            {"form_id": str(form1.form_id), "is_required": True},
        ]
    }
    url = f"/alpha/competitions/{competition.competition_id}/forms"
    resp = client.put(url, headers={"X-API-Key": internal_admin_user_api_key}, json=payload)

    assert resp.status_code == 403
