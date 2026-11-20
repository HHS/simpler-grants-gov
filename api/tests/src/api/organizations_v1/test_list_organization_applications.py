from datetime import timedelta
from uuid import uuid4

from src.constants.lookup_constants import ApplicationStatus, Privilege
from src.util import datetime_util
from tests.lib.organization_test_utils import create_user_in_org, create_user_not_in_org
from tests.src.db.models.factories import (
    ApplicationFactory,
    CompetitionFactory,
    OrganizationFactory,
)


def _list_applications(client, organization_id, token):
    return client.post(
        f"/v1/organizations/{organization_id}/applications/list",
        headers={"X-SGG-Token": token},
    )


def test_list_organization_applications_200(client, db_session, enable_factory_create):
    """Test that a member with VIEW_APPLICATION gets every application in the org"""
    user, organization, token = create_user_in_org(
        privileges=[Privilege.VIEW_ORG_MEMBERSHIP, Privilege.VIEW_APPLICATION],
        db_session=db_session,
    )
    applications = ApplicationFactory.create_batch(3, organization=organization)

    resp = _list_applications(client, organization.organization_id, token)

    assert resp.status_code == 200
    data = resp.get_json()["data"]
    # No pagination, so every application should come back
    assert len(data) == 3
    assert {app["application_id"] for app in data} == {
        str(app.application_id) for app in applications
    }
    expected_names = {str(app.application_id): app.application_name for app in applications}
    for app in data:
        assert set(app.keys()) == {"application_id", "application_name"}
        assert app["application_name"] == expected_names[app["application_id"]]


def test_list_organization_applications_empty(client, db_session, enable_factory_create):
    """Test that an org with no applications returns an empty list"""
    user, organization, token = create_user_in_org(
        privileges=[Privilege.VIEW_ORG_MEMBERSHIP, Privilege.VIEW_APPLICATION],
        db_session=db_session,
    )

    resp = _list_applications(client, organization.organization_id, token)

    assert resp.status_code == 200
    assert resp.get_json()["data"] == []


def test_list_organization_applications_name_falls_back_to_competition_title(
    client, db_session, enable_factory_create
):
    """Test that a null application_name falls back to the competition title"""
    user, organization, token = create_user_in_org(
        privileges=[Privilege.VIEW_ORG_MEMBERSHIP, Privilege.VIEW_APPLICATION],
        db_session=db_session,
    )
    competition = CompetitionFactory.create(competition_title="Rural Health Grant 2026")
    ApplicationFactory.create(
        organization=organization, competition=competition, application_name=None
    )

    resp = _list_applications(client, organization.organization_id, token)

    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert len(data) == 1
    assert data[0]["application_name"] == "Rural Health Grant 2026"


def test_list_organization_applications_name_falls_back_to_default(
    client, db_session, enable_factory_create
):
    """Test that a null application_name and null competition title return the default label"""
    user, organization, token = create_user_in_org(
        privileges=[Privilege.VIEW_ORG_MEMBERSHIP, Privilege.VIEW_APPLICATION],
        db_session=db_session,
    )
    competition = CompetitionFactory.create(competition_title=None)
    ApplicationFactory.create(
        organization=organization, competition=competition, application_name=None
    )

    resp = _list_applications(client, organization.organization_id, token)

    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert len(data) == 1
    assert data[0]["application_name"] == "Untitled Application"


def test_list_organization_applications_only_this_org(client, db_session, enable_factory_create):
    """Test that applications belonging to another organization are not returned"""
    user, organization, token = create_user_in_org(
        privileges=[Privilege.VIEW_ORG_MEMBERSHIP, Privilege.VIEW_APPLICATION],
        db_session=db_session,
    )
    own_application = ApplicationFactory.create(organization=organization)
    ApplicationFactory.create(organization=OrganizationFactory.create())
    # An application with no organization at all should not show up either
    ApplicationFactory.create(organization=None)

    resp = _list_applications(client, organization.organization_id, token)

    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert [app["application_id"] for app in data] == [str(own_application.application_id)]


def test_list_organization_applications_status_filter(client, db_session, enable_factory_create):
    """Test that IN_PROGRESS and SUBMITTED applications are returned and ACCEPTED is not"""
    user, organization, token = create_user_in_org(
        privileges=[Privilege.VIEW_ORG_MEMBERSHIP, Privilege.VIEW_APPLICATION],
        db_session=db_session,
    )
    in_progress = ApplicationFactory.create(
        organization=organization, application_status=ApplicationStatus.IN_PROGRESS
    )
    submitted = ApplicationFactory.create(
        organization=organization, application_status=ApplicationStatus.SUBMITTED
    )
    # Excluded until maintainers confirm whether ACCEPTED counts as "open/submitted"
    ApplicationFactory.create(
        organization=organization, application_status=ApplicationStatus.ACCEPTED
    )

    resp = _list_applications(client, organization.organization_id, token)

    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert {app["application_id"] for app in data} == {
        str(in_progress.application_id),
        str(submitted.application_id),
    }


def test_list_organization_applications_newest_first(client, db_session, enable_factory_create):
    """Test that applications are ordered by created_at, newest first"""
    user, organization, token = create_user_in_org(
        privileges=[Privilege.VIEW_ORG_MEMBERSHIP, Privilege.VIEW_APPLICATION],
        db_session=db_session,
    )
    now = datetime_util.utcnow()
    oldest = ApplicationFactory.create(
        organization=organization, created_at=now - timedelta(days=3)
    )
    newest = ApplicationFactory.create(
        organization=organization, created_at=now - timedelta(days=1)
    )
    middle = ApplicationFactory.create(
        organization=organization, created_at=now - timedelta(days=2)
    )

    resp = _list_applications(client, organization.organization_id, token)

    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert [app["application_id"] for app in data] == [
        str(newest.application_id),
        str(middle.application_id),
        str(oldest.application_id),
    ]


def test_list_organization_applications_403_privilege(client, db_session, enable_factory_create):
    """Test that a member without VIEW_APPLICATION gets 403"""
    # VIEW_ORG_MEMBERSHIP passes the base membership check (enough for roles/list),
    # but the extra VIEW_APPLICATION check should still deny access
    user, organization, token = create_user_in_org(
        privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
        db_session=db_session,
    )
    ApplicationFactory.create(organization=organization)

    resp = _list_applications(client, organization.organization_id, token)

    assert resp.status_code == 403


def test_list_organization_applications_403_organization(client, db_session, enable_factory_create):
    """Test that VIEW_APPLICATION in one org does not grant access to another org"""
    user, organization, token = create_user_in_org(
        privileges=[Privilege.VIEW_ORG_MEMBERSHIP, Privilege.VIEW_APPLICATION],
        db_session=db_session,
    )
    other_organization = OrganizationFactory.create()
    ApplicationFactory.create(organization=other_organization)

    resp = _list_applications(client, other_organization.organization_id, token)

    assert resp.status_code == 403


def test_list_organization_applications_404_organization(client, db_session, enable_factory_create):
    """Test listing applications for a non-existent organization"""
    user, token = create_user_not_in_org(db_session)

    resp = _list_applications(client, uuid4(), token)

    assert resp.status_code == 404


def test_list_organization_applications_401_no_token(client):
    """Test that listing applications without an auth token returns 401"""
    resp = client.post(f"/v1/organizations/{uuid4()}/applications/list")

    assert resp.status_code == 401
