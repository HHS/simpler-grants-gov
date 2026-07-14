import uuid
from io import BytesIO

import pytest
from grants_shared.util import file_util

from src.constants.lookup_constants import Privilege
from src.db.models import competition_models
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt_and_api_key
from tests.src.db.models.factories import CompetitionFactory, OpportunityFactory


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


def test_upload_instructions_success_single_file(
    client,
    grantor_auth_data,
    existing_opportunity,
    existing_competition,
    mock_s3_bucket,
    other_mock_s3_bucket,
    db_session,
):
    """Test successful upload of a single instruction file"""
    _, _, token, _ = grantor_auth_data

    file_content = b"This is instruction content"

    resp = client.post(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}/competitions/{existing_competition.competition_id}/instructions",
        headers={"X-SGG-Token": token},
        data={"file_attachment": (BytesIO(file_content), "instructions.pdf", "application/pdf")},
    )

    assert resp.status_code == 200
    response_json = resp.get_json()
    assert response_json["message"] == "Instruction uploaded successfully"
    assert "data" in response_json
    assert "competition_instruction_id" in response_json["data"]
    assert isinstance(response_json["data"]["competition_instruction_id"], str)

    # Verify database record
    instruction_id = response_json["data"]["competition_instruction_id"]
    instruction = (
        db_session.query(competition_models.CompetitionInstruction)
        .filter_by(competition_instruction_id=instruction_id)
        .first()
    )

    assert instruction is not None
    assert instruction.file_name == "instructions.pdf"
    assert file_util.file_exists(instruction.file_location) is True


def test_upload_instructions_unauthorized(
    client, db_session, existing_opportunity, existing_competition
):
    """Test upload without proper authorization"""
    # Create a user without UPDATE_OPPORTUNITY privilege
    user, agency, token, _ = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[Privilege.VIEW_OPPORTUNITY],
    )

    file_content = b"This is instruction content"

    resp = client.post(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}/competitions/{existing_competition.competition_id}/instructions",
        headers={"X-SGG-Token": token},
        data={"file_attachment": (BytesIO(file_content), "instructions.pdf", "application/pdf")},
    )

    assert resp.status_code == 403
    response_json = resp.get_json()
    assert response_json["message"] == "Forbidden"


def test_upload_instructions_nonexistent_opportunity(
    client, grantor_auth_data, existing_competition
):
    """Test upload with non-existent opportunity ID"""
    _, _, token, _ = grantor_auth_data

    non_existent_opportunity_id = uuid.uuid4()
    file_content = b"This is instruction content"

    resp = client.post(
        f"/v1/grantors/opportunities/{non_existent_opportunity_id}/competitions/{existing_competition.competition_id}/instructions",
        headers={"X-SGG-Token": token},
        data={"file_attachment": (BytesIO(file_content), "instructions.pdf", "application/pdf")},
    )

    assert resp.status_code == 404
    response_json = resp.get_json()
    assert (
        response_json["message"]
        == f"Could not find Opportunity with ID {non_existent_opportunity_id}"
    )


def test_upload_instructions_nonexistent_competition(
    client, grantor_auth_data, existing_opportunity
):
    """Test upload with non-existent competition ID"""
    _, _, token, _ = grantor_auth_data

    non_existent_competition_id = uuid.uuid4()
    file_content = b"This is instruction content"

    resp = client.post(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}/competitions/{non_existent_competition_id}/instructions",
        headers={"X-SGG-Token": token},
        data={"file_attachment": (BytesIO(file_content), "instructions.pdf", "application/pdf")},
    )

    assert resp.status_code == 404
    response_json = resp.get_json()
    assert (
        response_json["message"]
        == f"Could not find Competition with ID {non_existent_competition_id}"
    )


def test_upload_instructions_competition_wrong_opportunity(
    client, grantor_auth_data, existing_competition, enable_factory_create
):
    """Test upload when competition doesn't belong to the specified opportunity"""
    _, agency, token, _ = grantor_auth_data

    # Create a different opportunity
    other_opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code, is_draft=True, is_simpler_grants_opportunity=True
    )

    competition = existing_competition
    file_content = b"This is instruction content"

    resp = client.post(
        f"/v1/grantors/opportunities/{other_opportunity.opportunity_id}/competitions/{competition.competition_id}/instructions",
        headers={"X-SGG-Token": token},
        data={"file_attachment": (BytesIO(file_content), "instructions.pdf", "application/pdf")},
    )

    assert resp.status_code == 404
    response_json = resp.get_json()
    assert "not found for opportunity" in response_json["message"]


def test_upload_instructions_invalid_file(
    client, grantor_auth_data, existing_opportunity, existing_competition
):
    """Test upload with invalid file data"""
    _, _, token, _ = grantor_auth_data

    # Create an invalid "file" (just a string, not a file storage object)
    invalid_file = "This is not a valid file"

    resp = client.post(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}/competitions/{existing_competition.competition_id}/instructions",
        headers={"X-SGG-Token": token},
        data={"file_attachment": invalid_file},
    )

    assert resp.status_code == 422
    response_json = resp.get_json()
    assert response_json["message"] == "Validation error"


def test_upload_instructions_non_sgm_opportunity(
    client, db_session, grantor_auth_data, enable_factory_create
):
    """Test upload to a non-SGM opportunity"""
    _, agency, token, _ = grantor_auth_data

    # Create a non-SGM opportunity
    non_sgm_opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code, is_draft=True, is_simpler_grants_opportunity=False
    )

    # Create a competition for this opportunity
    competition = CompetitionFactory.create(
        opportunity=non_sgm_opportunity, opportunity_id=non_sgm_opportunity.opportunity_id
    )

    file_content = b"This is instruction content"

    resp = client.post(
        f"/v1/grantors/opportunities/{non_sgm_opportunity.opportunity_id}/competitions/{competition.competition_id}/instructions",
        headers={"X-SGG-Token": token},
        data={"file_attachment": (BytesIO(file_content), "instructions.pdf", "application/pdf")},
    )

    assert resp.status_code == 422
    response_json = resp.get_json()
    assert response_json["message"] == "Only opportunities created in Simpler Grants can be updated"
