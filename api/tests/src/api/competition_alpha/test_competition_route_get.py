import uuid
from datetime import date

import pytest
from freezegun import freeze_time

import src.util.file_util as file_util
from tests.src.db.models.factories import CompetitionFactory


def test_competition_get_200_with_api_key(client, api_auth_token, enable_factory_create):
    competition = CompetitionFactory.create()

    resp = client.get(
        f"/alpha/competitions/{competition.competition_id}", headers={"X-Auth": api_auth_token}
    )

    assert resp.status_code == 200
    response_competition = resp.get_json()["data"]

    assert response_competition["competition_id"] == str(competition.competition_id)
    assert response_competition["opportunity_id"] == competition.opportunity_id
    assert response_competition["competition_title"] == competition.competition_title
    assert response_competition["opening_date"] == competition.opening_date.isoformat()
    assert response_competition["closing_date"] == competition.closing_date.isoformat()
    assert response_competition["contact_info"] == competition.contact_info
    assert (
        response_competition["opportunity_assistance_listing"]["program_title"]
        == competition.opportunity_assistance_listing.program_title
    )
    assert (
        response_competition["opportunity_assistance_listing"]["assistance_listing_number"]
        == competition.opportunity_assistance_listing.assistance_listing_number
    )
    assert response_competition["open_to_applicants"] == competition.open_to_applicants


def test_competition_get_with_instructions_200(
    client, api_auth_token, enable_factory_create, monkeypatch, mock_s3_bucket
):
    monkeypatch.setattr(file_util, "_s3_config", None)

    # Create a competition with instructions and custom file contents
    competition = CompetitionFactory.create(with_instruction=True)

    # Reference the instruction object
    instruction = competition.competition_instructions[0]

    # Make the GET request
    resp = client.get(
        f"/alpha/competitions/{competition.competition_id}", headers={"X-Auth": api_auth_token}
    )

    assert resp.status_code == 200
    response_competition = resp.get_json()["data"]

    # Verify the competition instructions are included in the response
    assert len(response_competition["competition_instructions"]) > 0
    response_instruction = response_competition["competition_instructions"][0]

    # Verify instruction metadata
    assert response_instruction["file_name"] == instruction.file_name
    assert "created_at" in response_instruction
    assert "updated_at" in response_instruction

    # Verify the download URL is a presigned URL (contains signature)
    assert "X-Amz-Signature" in response_instruction["download_path"]

    # Extract relevant parts from the file_location
    competition_id_str = str(competition.competition_id)
    instruction_id_str = str(instruction.competition_instruction_id)

    # Verify key components are in the download path
    assert competition_id_str in response_instruction["download_path"]
    assert instruction_id_str in response_instruction["download_path"]
    assert instruction.file_name in response_instruction["download_path"]


def test_competition_get_with_cdn_instructions_200(
    client, api_auth_token, enable_factory_create, monkeypatch, mock_s3_bucket
):
    monkeypatch.setattr(file_util, "_s3_config", None)

    # Set the CDN URL environment variable
    monkeypatch.setenv("CDN_URL", "https://cdn.example.com")
    monkeypatch.setenv("PUBLIC_FILES_BUCKET", f"s3://{mock_s3_bucket}")

    # Create a competition with instructions
    competition = CompetitionFactory.create(with_instruction=True)

    # Reference the instruction object directly
    instruction = competition.competition_instructions[0]

    # Make the GET request
    resp = client.get(
        f"/alpha/competitions/{competition.competition_id}", headers={"X-Auth": api_auth_token}
    )

    assert resp.status_code == 200
    response_competition = resp.get_json()["data"]

    # Verify the competition instructions are included in the response
    assert len(response_competition["competition_instructions"]) > 0
    response_instruction = response_competition["competition_instructions"][0]

    # Verify instruction metadata
    assert response_instruction["file_name"] == instruction.file_name
    assert "created_at" in response_instruction
    assert "updated_at" in response_instruction

    # Verify the download URL is a CDN URL
    assert response_instruction["download_path"].startswith("https://cdn.example.com")

    # Extract relevant parts from the file_location
    competition_id_str = str(competition.competition_id)
    instruction_id_str = str(instruction.competition_instruction_id)

    # Verify key components are in the download path
    assert competition_id_str in response_instruction["download_path"]
    assert instruction_id_str in response_instruction["download_path"]
    assert instruction.file_name in response_instruction["download_path"]


def test_competition_get_200_with_jwt(client, user_auth_token, enable_factory_create):
    competition = CompetitionFactory.create()

    resp = client.get(
        f"/alpha/competitions/{competition.competition_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert resp.status_code == 200
    response_competition = resp.get_json()["data"]

    assert response_competition["competition_id"] == str(competition.competition_id)
    assert response_competition["opportunity_id"] == competition.opportunity_id
    assert response_competition["competition_title"] == competition.competition_title
    assert response_competition["opening_date"] == competition.opening_date.isoformat()
    assert response_competition["closing_date"] == competition.closing_date.isoformat()
    assert response_competition["contact_info"] == competition.contact_info
    assert (
        response_competition["opportunity_assistance_listing"]["program_title"]
        == competition.opportunity_assistance_listing.program_title
    )
    assert (
        response_competition["opportunity_assistance_listing"]["assistance_listing_number"]
        == competition.opportunity_assistance_listing.assistance_listing_number
    )
    assert response_competition["open_to_applicants"] == competition.open_to_applicants


@pytest.mark.parametrize(
    "opening_date,closing_date,grace_period, expected_is_open",
    [
        # None opening/close date means it's always open
        (None, None, None, True),
        (date(2025, 1, 1), date(2025, 12, 31), 10, True),
        # On closing date is fine
        (date(2025, 1, 1), date(2025, 1, 15), 0, True),
        # On closing date with help of grace period
        (date(2025, 1, 1), date(2025, 1, 1), 14, True),
        # On opening date
        (date(2025, 1, 15), date(2025, 1, 31), 0, True),
        # Day before opening date
        (date(2025, 1, 16), date(2025, 1, 31), 0, False),
        # Day after closing date
        (date(2025, 1, 1), date(2025, 1, 14), 0, False),
        # Day after closing date + grace period
        (date(2025, 1, 1), date(2025, 1, 10), 4, False),
    ],
)
@freeze_time("2025-01-15 12:00:00", tz_offset=0)
def test_competition_get_200_is_open(
    client,
    api_auth_token,
    enable_factory_create,
    opening_date,
    closing_date,
    grace_period,
    expected_is_open,
):
    competition = CompetitionFactory.create(
        opening_date=opening_date, closing_date=closing_date, grace_period=grace_period
    )

    resp = client.get(
        f"/alpha/competitions/{competition.competition_id}", headers={"X-Auth": api_auth_token}
    )

    assert resp.status_code == 200
    response_competition = resp.get_json()["data"]

    assert response_competition["is_open"] == expected_is_open


def test_competition_get_404_not_found(client, api_auth_token):
    competition_id = uuid.uuid4()
    resp = client.get(f"/alpha/competitions/{competition_id}", headers={"X-Auth": api_auth_token})

    assert resp.status_code == 404
    assert resp.get_json()["message"] == f"Could not find Competition with ID {competition_id}"


def test_competition_get_401_unauthorized(client, api_auth_token, enable_factory_create):
    competition = CompetitionFactory.create()

    resp = client.get(
        f"/alpha/competitions/{competition.competition_id}", headers={"X-Auth": "some-other-token"}
    )

    assert resp.status_code == 401
    assert (
        resp.get_json()["message"]
        == "The server could not verify that you are authorized to access the URL requested"
    )
