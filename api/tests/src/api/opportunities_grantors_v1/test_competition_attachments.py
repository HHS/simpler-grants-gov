import uuid

import pytest
from grants_shared.util import file_util
from sqlalchemy import select

from src.constants.lookup_constants import FileScanStatus, Privilege
from src.db.models import competition_models
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt_and_api_key
from tests.src.db.models.factories import (
    CompetitionFactory,
    CompetitionInstructionFactory,
    OpportunityFactory,
    PendingFileFactory,
    UserFactory,
)


def make_pending_file(
    user, s3_config, file_scan_status=FileScanStatus.COMPLETE, file_name="instructions.pdf"
):
    """Create a PendingFile backed by a real S3 file."""
    source_location = f"{s3_config.file_scan_bucket_path}/scan_complete/{uuid.uuid4()}/{file_name}"
    file_util.write_to_file(source_location, "This is instruction content")
    return PendingFileFactory.create(
        user=user,
        file_name=file_name,
        file_location=source_location,
        file_scan_status=file_scan_status,
        mime_type="application/pdf",
    )


@pytest.fixture
def grantor_auth_data(db_session, enable_factory_create):
    """Create a user with UPDATE_OPPORTUNITY permission"""
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


@pytest.fixture
def existing_competition(existing_opportunity, enable_factory_create):
    """Create a competition for the opportunity"""
    return CompetitionFactory.create(
        opportunity=existing_opportunity, opportunity_id=existing_opportunity.opportunity_id
    )


@pytest.fixture
def existing_instruction(
    existing_competition, mock_s3_bucket, other_mock_s3_bucket, enable_factory_create
):
    """Create a competition instruction for the competition"""
    return CompetitionInstructionFactory.create(
        competition=existing_competition,
        competition_id=existing_competition.competition_id,
    )


def test_upload_instructions_success_single_file(
    client,
    grantor_auth_data,
    existing_opportunity,
    existing_competition,
    s3_config,
    db_session,
):
    """Test successful upload of a single instruction file"""
    user, _, token, _ = grantor_auth_data

    pending_file = make_pending_file(user, s3_config)

    resp = client.post(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}/competitions/{existing_competition.competition_id}/instructions",
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(pending_file.pending_file_id)},
    )

    assert resp.status_code == 200, resp.get_json()
    response_json = resp.get_json()
    assert response_json["message"] == "Instruction uploaded successfully"
    data = response_json["data"]
    assert "competition_instruction_id" in data
    assert data["file_name"] == "instructions.pdf"
    assert data["created_at"] is not None
    assert data["updated_at"] is not None

    # Verify database record
    instruction_id = data["competition_instruction_id"]
    instruction = db_session.execute(
        select(competition_models.CompetitionInstruction).where(
            competition_models.CompetitionInstruction.competition_instruction_id == instruction_id
        )
    ).scalar_one_or_none()

    assert instruction is not None
    assert instruction.file_name == "instructions.pdf"
    assert file_util.file_exists(instruction.file_location) is True

    # Pending file was moved out of its scanned location and marked PROCESSED
    assert file_util.file_exists(pending_file.file_location) is False
    db_session.refresh(pending_file)
    assert pending_file.file_scan_status == FileScanStatus.PROCESSED


def test_upload_instructions_unauthorized(
    client, db_session, existing_opportunity, existing_competition, s3_config
):
    """Test upload without proper authorization"""
    # Create a user without UPDATE_OPPORTUNITY privilege
    user, agency, token, _ = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[Privilege.VIEW_OPPORTUNITY],
    )

    pending_file = make_pending_file(user, s3_config)

    resp = client.post(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}/competitions/{existing_competition.competition_id}/instructions",
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(pending_file.pending_file_id)},
    )

    assert resp.status_code == 403
    response_json = resp.get_json()
    assert response_json["message"] == "Forbidden"


def test_upload_instructions_nonexistent_opportunity(
    client, grantor_auth_data, existing_competition, s3_config
):
    """Test upload with non-existent opportunity ID"""
    user, _, token, _ = grantor_auth_data

    non_existent_opportunity_id = uuid.uuid4()
    pending_file = make_pending_file(user, s3_config)

    resp = client.post(
        f"/v1/grantors/opportunities/{non_existent_opportunity_id}/competitions/{existing_competition.competition_id}/instructions",
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(pending_file.pending_file_id)},
    )

    assert resp.status_code == 404
    response_json = resp.get_json()
    assert (
        response_json["message"]
        == f"Could not find Opportunity with ID {non_existent_opportunity_id}"
    )


def test_upload_instructions_nonexistent_competition(
    client, grantor_auth_data, existing_opportunity, s3_config
):
    """Test upload with non-existent competition ID"""
    user, _, token, _ = grantor_auth_data

    non_existent_competition_id = uuid.uuid4()
    pending_file = make_pending_file(user, s3_config)

    resp = client.post(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}/competitions/{non_existent_competition_id}/instructions",
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(pending_file.pending_file_id)},
    )

    assert resp.status_code == 404
    response_json = resp.get_json()
    assert (
        response_json["message"]
        == f"Could not find Competition with ID {non_existent_competition_id}"
    )


def test_upload_instructions_competition_wrong_opportunity(
    client, grantor_auth_data, existing_competition, enable_factory_create, s3_config
):
    """Test upload when competition doesn't belong to the specified opportunity"""
    user, agency, token, _ = grantor_auth_data

    # Create a different opportunity
    other_opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code, is_draft=True, is_simpler_grants_opportunity=True
    )

    competition = existing_competition
    pending_file = make_pending_file(user, s3_config)

    resp = client.post(
        f"/v1/grantors/opportunities/{other_opportunity.opportunity_id}/competitions/{competition.competition_id}/instructions",
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(pending_file.pending_file_id)},
    )

    assert resp.status_code == 404
    response_json = resp.get_json()
    assert "not found for opportunity" in response_json["message"]


def test_upload_instructions_nonexistent_pending_file(
    client, grantor_auth_data, existing_opportunity, existing_competition
):
    """Test upload with a pending_file_id that does not exist"""
    _, _, token, _ = grantor_auth_data

    missing_pending_file_id = uuid.uuid4()

    resp = client.post(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}/competitions/{existing_competition.competition_id}/instructions",
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(missing_pending_file_id)},
    )

    assert resp.status_code == 404
    response_json = resp.get_json()
    assert response_json["message"] == "Pending file not found"


def test_upload_instructions_pending_file_belongs_to_other_user(
    client, grantor_auth_data, existing_opportunity, existing_competition, s3_config
):
    """Test upload with a pending_file_id owned by a different user"""
    _, _, token, _ = grantor_auth_data
    other_user = UserFactory.create()
    pending_file = make_pending_file(other_user, s3_config)

    resp = client.post(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}/competitions/{existing_competition.competition_id}/instructions",
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(pending_file.pending_file_id)},
    )

    assert resp.status_code == 403
    response_json = resp.get_json()
    assert response_json["message"] == "You do not have permission to access this file"


def test_upload_instructions_pending_file_scan_not_complete(
    client, grantor_auth_data, existing_opportunity, existing_competition, s3_config
):
    """Test upload with a pending_file_id whose scan status is not complete"""
    user, _, token, _ = grantor_auth_data
    pending_file = make_pending_file(user, s3_config, file_scan_status=FileScanStatus.PENDING)

    resp = client.post(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}/competitions/{existing_competition.competition_id}/instructions",
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(pending_file.pending_file_id)},
    )

    assert resp.status_code == 422
    response_json = resp.get_json()
    assert response_json["message"] == "File cannot be used, status must be complete"


def test_upload_instructions_non_sgm_opportunity(
    client, db_session, grantor_auth_data, enable_factory_create, s3_config
):
    """Test upload to a non-SGM opportunity"""
    user, agency, token, _ = grantor_auth_data

    # Create a non-SGM opportunity
    non_sgm_opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code, is_draft=True, is_simpler_grants_opportunity=False
    )

    # Create a competition for this opportunity
    competition = CompetitionFactory.create(
        opportunity=non_sgm_opportunity, opportunity_id=non_sgm_opportunity.opportunity_id
    )

    pending_file = make_pending_file(user, s3_config)

    resp = client.post(
        f"/v1/grantors/opportunities/{non_sgm_opportunity.opportunity_id}/competitions/{competition.competition_id}/instructions",
        headers={"X-SGG-Token": token},
        json={"pending_file_id": str(pending_file.pending_file_id)},
    )

    assert resp.status_code == 422
    response_json = resp.get_json()
    assert response_json["message"] == "Only opportunities created in Simpler Grants can be updated"


def test_delete_instruction_success(
    client,
    grantor_auth_data,
    existing_opportunity,
    existing_competition,
    existing_instruction,
    db_session,
):
    """Test successful deletion of a competition instruction"""
    _, _, token, _ = grantor_auth_data

    # Verify instruction exists before deletion
    assert (
        db_session.execute(
            select(competition_models.CompetitionInstruction).where(
                competition_models.CompetitionInstruction.competition_instruction_id
                == existing_instruction.competition_instruction_id
            )
        ).scalar_one_or_none()
        is not None
    )

    resp = client.delete(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}/competitions/{existing_competition.competition_id}/instructions/{existing_instruction.competition_instruction_id}",
        headers={"X-SGG-Token": token},
    )

    assert resp.status_code == 200
    response_json = resp.get_json()
    assert response_json["message"] == "Instruction deleted successfully"

    # Verify instruction is deleted from database
    assert (
        db_session.execute(
            select(competition_models.CompetitionInstruction).where(
                competition_models.CompetitionInstruction.competition_instruction_id
                == existing_instruction.competition_instruction_id
            )
        ).scalar_one_or_none()
        is None
    )

    # Verify file is deleted from S3
    assert file_util.file_exists(existing_instruction.file_location) is False


def test_delete_instruction_unauthorized(
    client, db_session, existing_opportunity, existing_competition, existing_instruction
):
    """Test deletion without proper authorization"""
    # Create a user without UPDATE_OPPORTUNITY privilege
    user, agency, token, _ = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[Privilege.VIEW_OPPORTUNITY],
    )

    resp = client.delete(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}/competitions/{existing_competition.competition_id}/instructions/{existing_instruction.competition_instruction_id}",
        headers={"X-SGG-Token": token},
    )

    assert resp.status_code == 403
    response_json = resp.get_json()
    assert response_json["message"] == "Forbidden"


def test_delete_instruction_nonexistent_opportunity(
    client, grantor_auth_data, existing_competition, existing_instruction
):
    """Test deletion with non-existent opportunity ID"""
    _, _, token, _ = grantor_auth_data

    non_existent_opportunity_id = uuid.uuid4()

    resp = client.delete(
        f"/v1/grantors/opportunities/{non_existent_opportunity_id}/competitions/{existing_competition.competition_id}/instructions/{existing_instruction.competition_instruction_id}",
        headers={"X-SGG-Token": token},
    )

    assert resp.status_code == 404
    response_json = resp.get_json()
    assert (
        response_json["message"]
        == f"Could not find Opportunity with ID {non_existent_opportunity_id}"
    )


def test_delete_instruction_nonexistent_competition(
    client, grantor_auth_data, existing_opportunity, existing_instruction
):
    """Test deletion with non-existent competition ID"""
    _, _, token, _ = grantor_auth_data

    non_existent_competition_id = uuid.uuid4()

    resp = client.delete(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}/competitions/{non_existent_competition_id}/instructions/{existing_instruction.competition_instruction_id}",
        headers={"X-SGG-Token": token},
    )

    assert resp.status_code == 404
    response_json = resp.get_json()
    assert (
        response_json["message"]
        == f"Could not find Competition with ID {non_existent_competition_id}"
    )


def test_delete_instruction_competition_wrong_opportunity(
    client, grantor_auth_data, existing_competition, existing_instruction, enable_factory_create
):
    """Test deletion when competition doesn't belong to the specified opportunity"""
    _, agency, token, _ = grantor_auth_data

    # Create a different opportunity
    other_opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code, is_draft=True, is_simpler_grants_opportunity=True
    )

    resp = client.delete(
        f"/v1/grantors/opportunities/{other_opportunity.opportunity_id}/competitions/{existing_competition.competition_id}/instructions/{existing_instruction.competition_instruction_id}",
        headers={"X-SGG-Token": token},
    )

    assert resp.status_code == 404
    response_json = resp.get_json()
    assert "not found for opportunity" in response_json["message"]


def test_delete_instruction_nonexistent_instruction(
    client, grantor_auth_data, existing_opportunity, existing_competition
):
    """Test deletion with non-existent instruction ID"""
    _, _, token, _ = grantor_auth_data

    non_existent_instruction_id = uuid.uuid4()

    resp = client.delete(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}/competitions/{existing_competition.competition_id}/instructions/{non_existent_instruction_id}",
        headers={"X-SGG-Token": token},
    )

    assert resp.status_code == 404
    response_json = resp.get_json()
    assert response_json["message"] == "Instruction not found"


def test_delete_instruction_non_sgm_opportunity(
    client,
    db_session,
    grantor_auth_data,
    enable_factory_create,
    mock_s3_bucket,
    other_mock_s3_bucket,
):
    """Test deletion from a non-SGM opportunity"""
    _, agency, token, _ = grantor_auth_data

    # Create a non-SGM opportunity
    non_sgm_opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code, is_draft=True, is_simpler_grants_opportunity=False
    )

    # Create a competition and instruction for this opportunity
    competition = CompetitionFactory.create(
        opportunity=non_sgm_opportunity, opportunity_id=non_sgm_opportunity.opportunity_id
    )

    instruction = CompetitionInstructionFactory.create(
        competition=competition,
        competition_id=competition.competition_id,
    )

    resp = client.delete(
        f"/v1/grantors/opportunities/{non_sgm_opportunity.opportunity_id}/competitions/{competition.competition_id}/instructions/{instruction.competition_instruction_id}",
        headers={"X-SGG-Token": token},
    )

    assert resp.status_code == 422
    response_json = resp.get_json()
    assert response_json["message"] == "Only opportunities created in Simpler Grants can be updated"
