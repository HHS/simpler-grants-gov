import uuid

import pytest
from grants_shared.util import file_util
from sqlalchemy import select

from src.constants.lookup_constants import FileScanStatus, Privilege
from src.db.models import opportunity_models
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt_and_api_key
from tests.src.db.models.factories import OpportunityFactory, PendingFileFactory, UserFactory


@pytest.fixture
def grantor_auth_data(db_session, enable_factory_create):
    """Create a user with UPDATE_OPPORTUNITY permission and return auth data"""
    user, agency, token, api_key_id = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[Privilege.VIEW_OPPORTUNITY, Privilege.UPDATE_OPPORTUNITY],
    )
    return user, agency, token, api_key_id


@pytest.fixture
def existing_opportunity(grantor_auth_data, enable_factory_create):
    """Create an opportunity belonging to the grantor's agency"""
    user, agency, _, _ = grantor_auth_data
    return OpportunityFactory.create(
        agency_code=agency.agency_code, is_draft=True, is_simpler_grants_opportunity=True
    )


def make_pending_file(
    user, s3_config, file_scan_status=FileScanStatus.COMPLETE, mime_type="application/pdf"
):
    """Create a PendingFile backed by a real S3 file."""
    file_name = "test-attachment.pdf"
    source_location = f"{s3_config.file_scan_bucket_path}/scan_complete/{uuid.uuid4()}/{file_name}"
    file_util.write_to_file(source_location, "test file content")
    return PendingFileFactory.create(
        user=user,
        file_name=file_name,
        file_location=source_location,
        file_scan_status=file_scan_status,
        mime_type=mime_type,
    )


ROUTE = "/v1/grantors/opportunities/{opportunity_id}/attachments/temporary"


def test_create_from_pending_file_200(
    client, db_session, enable_factory_create, grantor_auth_data, existing_opportunity, s3_config
):
    user, _, token, _ = grantor_auth_data
    pending_file = make_pending_file(user, s3_config)

    resp = client.post(
        ROUTE.format(opportunity_id=existing_opportunity.opportunity_id),
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(pending_file.pending_file_id)},
    )

    assert resp.status_code == 200, resp.get_json()
    data = resp.get_json()["data"]
    assert data["opportunity_attachment_id"] is not None
    assert data["file_name"] == "test-attachment.pdf"
    assert data["mime_type"] == "application/pdf"

    attachment = db_session.execute(
        select(opportunity_models.OpportunityAttachment).where(
            opportunity_models.OpportunityAttachment.attachment_id
            == data["opportunity_attachment_id"]
        )
    ).scalar_one()
    assert file_util.file_exists(attachment.file_location) is True
    assert file_util.file_exists(pending_file.file_location) is False
    db_session.refresh(pending_file)
    assert pending_file.file_scan_status == FileScanStatus.PROCESSED


def test_create_from_pending_file_403_missing_privilege(
    client, db_session, enable_factory_create, existing_opportunity, s3_config
):
    user, agency, token, _ = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session, privileges=[Privilege.VIEW_OPPORTUNITY]
    )
    pending_file = make_pending_file(user, s3_config)

    resp = client.post(
        ROUTE.format(opportunity_id=existing_opportunity.opportunity_id),
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(pending_file.pending_file_id)},
    )
    assert resp.status_code == 403


def test_create_from_pending_file_403_other_users_file(
    client, db_session, enable_factory_create, grantor_auth_data, existing_opportunity, s3_config
):
    _, _, token, _ = grantor_auth_data
    other_user = UserFactory.create()
    pending_file = make_pending_file(other_user, s3_config)

    resp = client.post(
        ROUTE.format(opportunity_id=existing_opportunity.opportunity_id),
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(pending_file.pending_file_id)},
    )
    assert resp.status_code == 403


def test_create_from_pending_file_404_opportunity_not_found(
    client, db_session, enable_factory_create, grantor_auth_data, s3_config
):
    user, _, token, _ = grantor_auth_data
    pending_file = make_pending_file(user, s3_config)

    resp = client.post(
        ROUTE.format(opportunity_id=uuid.uuid4()),
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(pending_file.pending_file_id)},
    )
    assert resp.status_code == 404


def test_create_from_pending_file_404_pending_file_not_found(
    client, db_session, enable_factory_create, grantor_auth_data, existing_opportunity
):
    _, _, token, _ = grantor_auth_data
    resp = client.post(
        ROUTE.format(opportunity_id=existing_opportunity.opportunity_id),
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(uuid.uuid4())},
    )
    assert resp.status_code == 404


def test_create_from_pending_file_422_missing_pending_file_id(
    client, db_session, enable_factory_create, grantor_auth_data, existing_opportunity
):
    _, _, token, _ = grantor_auth_data
    resp = client.post(
        ROUTE.format(opportunity_id=existing_opportunity.opportunity_id),
        headers={"X-SGG-Token": token},
        json={},
    )
    assert resp.status_code == 422


def test_create_from_pending_file_422_scan_not_complete(
    client, db_session, enable_factory_create, grantor_auth_data, existing_opportunity, s3_config
):
    user, _, token, _ = grantor_auth_data
    pending_file = make_pending_file(user, s3_config, file_scan_status=FileScanStatus.PENDING)

    resp = client.post(
        ROUTE.format(opportunity_id=existing_opportunity.opportunity_id),
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(pending_file.pending_file_id)},
    )
    assert resp.status_code == 422


def test_create_from_pending_file_422_scan_infected(
    client, db_session, enable_factory_create, grantor_auth_data, existing_opportunity, s3_config
):
    user, _, token, _ = grantor_auth_data
    pending_file = make_pending_file(user, s3_config, file_scan_status=FileScanStatus.INFECTED)

    resp = client.post(
        ROUTE.format(opportunity_id=existing_opportunity.opportunity_id),
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(pending_file.pending_file_id)},
    )
    assert resp.status_code == 422


def test_create_from_pending_file_422_published_non_sgm_opportunity(
    client, db_session, enable_factory_create, grantor_auth_data, s3_config
):
    user, agency, token, _ = grantor_auth_data
    opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code, is_draft=False, is_simpler_grants_opportunity=False
    )
    pending_file = make_pending_file(user, s3_config)

    resp = client.post(
        ROUTE.format(opportunity_id=opportunity.opportunity_id),
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(pending_file.pending_file_id)},
    )
    assert resp.status_code == 422


def test_create_from_pending_file_200_published_sgm_opportunity(
    client, db_session, enable_factory_create, grantor_auth_data, s3_config
):
    user, agency, token, _ = grantor_auth_data
    opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code, is_draft=False, is_simpler_grants_opportunity=True
    )
    pending_file = make_pending_file(user, s3_config)

    resp = client.post(
        ROUTE.format(opportunity_id=opportunity.opportunity_id),
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(pending_file.pending_file_id)},
    )
    assert resp.status_code == 200, resp.get_json()
