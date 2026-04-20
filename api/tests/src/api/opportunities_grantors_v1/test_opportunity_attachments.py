import uuid

import pytest

from src.constants.lookup_constants import Privilege
from src.db.models import opportunity_models
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt_and_api_key
from tests.src.db.models.factories import OpportunityAttachmentFactory, OpportunityFactory


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
    return OpportunityFactory.create(agency_code=agency.agency_code, is_draft=True)


@pytest.fixture
def existing_attachment(db_session, existing_opportunity, enable_factory_create, mock_s3_bucket):
    """Create an attachment for the opportunity"""
    print(f"Creating attachment for opportunity ID: {existing_opportunity.opportunity_id}")

    attachment = opportunity_models.OpportunityAttachment(
        attachment_id=uuid.uuid4(),
        legacy_attachment_id=12345,
        opportunity_id=existing_opportunity.opportunity_id,
        file_name="test_file.pdf",
        file_description="Test attachment",
        file_location=f"s3://{mock_s3_bucket}/test-file.pdf",
        mime_type="application/pdf",
        file_size_bytes=1024,
    )
    db_session.add(attachment)
    db_session.commit()

    return attachment


def test_delete_attachment_success(
    client, grantor_auth_data, existing_opportunity, existing_attachment
):
    """Test successful deletion of an attachment"""
    _, _, token, _ = grantor_auth_data

    attachment_id = existing_attachment.attachment_id
    opportunity_id = existing_opportunity.opportunity_id

    resp = client.delete(
        f"/v1/grantors/opportunities/{opportunity_id}/attachments/{attachment_id}",
        headers={"X-SGG-Token": token},
    )

    assert resp.status_code == 200
    response_json = resp.get_json()
    assert response_json["message"] == "Attachment successfully deleted"


def test_delete_attachment_nonexistent_opportunity(client, grantor_auth_data, existing_attachment):
    """Test deletion with non-existent opportunity ID"""
    _, _, token, _ = grantor_auth_data

    non_existent_opportunity_id = uuid.uuid4()
    attachment_id = existing_attachment.attachment_id

    resp = client.delete(
        f"/v1/grantors/opportunities/{non_existent_opportunity_id}/attachments/{attachment_id}",
        headers={"X-SGG-Token": token},
    )

    assert resp.status_code == 404
    response_json = resp.get_json()
    assert (
        response_json["message"]
        == f"Could not find Opportunity with ID {non_existent_opportunity_id}"
    )


def test_delete_attachment_nonexistent_attachment(client, grantor_auth_data, existing_opportunity):
    """Test deletion with non-existent attachment ID"""
    _, _, token, _ = grantor_auth_data

    opportunity_id = existing_opportunity.opportunity_id
    non_existent_attachment_id = uuid.uuid4()

    resp = client.delete(
        f"/v1/grantors/opportunities/{opportunity_id}/attachments/{non_existent_attachment_id}",
        headers={"X-SGG-Token": token},
    )

    assert resp.status_code == 404
    response_json = resp.get_json()
    assert response_json["message"] == "Attachment not found"


def test_delete_attachment_unauthorized(
    client, db_session, existing_opportunity, existing_attachment
):
    """Test deletion without proper authorization"""
    # Create a user without UPDATE_OPPORTUNITY privilege
    user, agency, token, _ = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[Privilege.VIEW_OPPORTUNITY],
    )

    opportunity_id = existing_opportunity.opportunity_id
    attachment_id = existing_attachment.attachment_id

    resp = client.delete(
        f"/v1/grantors/opportunities/{opportunity_id}/attachments/{attachment_id}",
        headers={"X-SGG-Token": token},
    )

    assert resp.status_code == 403
    response_json = resp.get_json()
    assert response_json["message"] == "Forbidden"


def test_delete_attachment_published_opportunity(
    client, db_session, grantor_auth_data, mock_s3_bucket, enable_factory_create
):
    """Test deletion from a published (non-draft) opportunity"""
    _, agency, token, _ = grantor_auth_data

    # Create a published opportunity
    published_opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code, is_draft=False
    )

    # Create an attachment for the published opportunity
    attachment = OpportunityAttachmentFactory.create(
        opportunity_id=published_opportunity.opportunity_id,
        file_name="test_file.pdf",
        file_description="Test attachment for published opportunity",
        file_location=f"s3://{mock_s3_bucket}/published-test-file.pdf",
        mime_type="application/pdf",
        file_size_bytes=1024,
        legacy_attachment_id=12345,
    )

    resp = client.delete(
        f"/v1/grantors/opportunities/{published_opportunity.opportunity_id}/attachments/{attachment.attachment_id}",
        headers={"X-SGG-Token": token},
    )

    assert resp.status_code == 422
    response_json = resp.get_json()
    assert response_json["message"] == "Only draft opportunities can be updated"
