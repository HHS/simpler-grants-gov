
import pytest

from src.constants.lookup_constants import Privilege
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
    _, agency, _, _ = grantor_auth_data
    return OpportunityFactory.create(agency_code=agency.agency_code, is_draft=True)


@pytest.fixture
def existing_attachment(db_session, existing_opportunity, enable_factory_create):
    """Create an attachment for the opportunity"""
    attachment = OpportunityAttachmentFactory.create(
        opportunity_id=existing_opportunity.opportunity_id,
        file_name="test_file.pdf",
        file_description="Test attachment",
        file_location="s3://test-bucket/test-file.pdf",
        mime_type="application/pdf",
        file_size_bytes=1024,
        legacy_attachment_id=12345,
    )
    return attachment


# @pytest.fixture
# def mock_opportunity_attachment(db_session, existing_opportunity, monkeypatch):
#     """Create an attachment for the opportunity without writing to S3"""
#     # Patch the file_util.delete_file function to do nothing
#     monkeypatch.setattr(file_util, "delete_file", lambda x: None)

#     # Create the attachment directly without using the factory
#     attachment = opportunity_models.OpportunityAttachment(
#         attachment_id=uuid.uuid4(),
#         legacy_attachment_id=12345,
#         opportunity_id=existing_opportunity.opportunity_id,
#         file_name="test_file.pdf",
#         file_description="Test attachment",
#         file_location="s3://test-bucket/test-file.pdf",
#         mime_type="application/pdf",
#         file_size_bytes=1024,
#     )
#     db_session.add(attachment)
#     db_session.commit()
#     return attachment


# def test_delete_attachment_success(
#     client, db_session, grantor_auth_data, existing_opportunity, mock_opportunity_attachment
# ):
#     """Test successful deletion of an attachment"""
#     _, _, token, _ = grantor_auth_data

#     # Verify attachment exists before deletion
#     attachment_id = mock_opportunity_attachment.attachment_id
#     opportunity_id = existing_opportunity.opportunity_id

#     attachment_before = db_session.execute(
#         select(OpportunityAttachment).where(OpportunityAttachment.attachment_id == attachment_id)
#     ).scalar_one_or_none()
#     assert attachment_before is not None

#     # Delete the attachment
#     resp = client.delete(
#         f"/v1/grantors/opportunities/{opportunity_id}/attachments/{attachment_id}",
#         headers={"X-SGG-Token": token},
#     )

#     # Verify response
#     assert resp.status_code == 200
#     data = resp.get_json()
#     assert data["message"] == "Attachment successfully deleted"

#     # Verify attachment is deleted from database
#     attachment_after = db_session.execute(
#         select(OpportunityAttachment).where(OpportunityAttachment.attachment_id == attachment_id)
#     ).scalar_one_or_none()
#     assert attachment_after is None


# def test_delete_attachment_nonexistent_opportunity(client, grantor_auth_data, existing_attachment):
#     """Test deletion with non-existent opportunity ID"""
#     _, _, token, _ = grantor_auth_data

#     non_existent_opportunity_id = uuid.uuid4()
#     attachment_id = mock_opportunity_attachment.attachment_id

#     resp = client.delete(
#         f"/v1/grantors/opportunities/{non_existent_opportunity_id}/attachments/{attachment_id}",
#         headers={"X-SGG-Token": token},
#     )

#     assert resp.status_code == 404
#     data = resp.get_json()
#     assert "not found" in data.get("message", "").lower()


# def test_delete_attachment_nonexistent_attachment(client, grantor_auth_data, existing_opportunity):
#     """Test deletion with non-existent attachment ID"""
#     _, _, token, _ = grantor_auth_data

#     opportunity_id = existing_opportunity.opportunity_id
#     non_existent_attachment_id = uuid.uuid4()

#     resp = client.delete(
#         f"/v1/grantors/opportunities/{opportunity_id}/attachments/{non_existent_attachment_id}",
#         headers={"X-SGG-Token": token},
#     )

#     assert resp.status_code == 404
#     data = resp.get_json()
#     assert "attachment not found" in data.get("message", "").lower()


# def test_delete_attachment_unauthorized(
#     client, db_session, existing_opportunity, mock_opportunity_attachment
# ):
#     """Test deletion without proper authorization"""
#     # Create a user without UPDATE_OPPORTUNITY privilege
#     user, agency, token, _ = create_user_in_agency_with_jwt_and_api_key(
#         db_session=db_session,
#         privileges=[Privilege.VIEW_OPPORTUNITY],  # Missing UPDATE_OPPORTUNITY
#     )

#     opportunity_id = existing_opportunity.opportunity_id
#     attachment_id = mock_opportunity_attachment.attachment_id

#     resp = client.delete(
#         f"/v1/grantors/opportunities/{opportunity_id}/attachments/{attachment_id}",
#         headers={"X-SGG-Token": token},
#     )

#     assert resp.status_code == 403


# def test_delete_attachment_published_opportunity(
#     client, db_session, grantor_auth_data, monkeypatch
# ):
#     """Test deletion from a published (non-draft) opportunity"""
#     _, agency, token, _ = grantor_auth_data

#     # Patch the file_util.delete_file function to do nothing
#     monkeypatch.setattr(file_util, "delete_file", lambda x: None)

#     # Create a published opportunity
#     published_opportunity = OpportunityFactory.create(
#         agency_code=agency.agency_code, is_draft=False  # Published opportunity
#     )

#     # Create an attachment directly without using the factory
#     attachment = opportunity_models.OpportunityAttachment(
#         attachment_id=uuid.uuid4(),
#         legacy_attachment_id=12345,
#         opportunity_id=published_opportunity.opportunity_id,
#         file_name="test_file.pdf",
#         file_description="Test attachment",
#         file_location="s3://test-bucket/test-file.pdf",
#         mime_type="application/pdf",
#         file_size_bytes=1024,
#     )

#     resp = client.delete(
#         f"/v1/grantors/opportunities/{published_opportunity.opportunity_id}/attachments/{attachment.attachment_id}",
#         headers={"X-SGG-Token": token},
#     )

#     assert resp.status_code == 422
#     data = resp.get_json()
#     assert "draft" in data.get("message", "").lower()
