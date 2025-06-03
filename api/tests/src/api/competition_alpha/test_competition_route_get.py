import uuid
from datetime import date
from unittest import mock

import pytest
from freezegun import freeze_time

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


def test_competition_get_with_instructions_200(client, api_auth_token, enable_factory_create):
    # Create a competition with instructions
    competition = CompetitionFactory.create(with_instruction=True)

    # Mock the download_path property for CompetitionInstruction
    presigned_url = "https://example.com/competition-instructions/file.pdf"
    with mock.patch(
        "src.db.models.competition_models.CompetitionInstruction.download_path", 
        new_callable=mock.PropertyMock,
        return_value=presigned_url,
    ):
        resp = client.get(
            f"/alpha/competitions/{competition.competition_id}", headers={"X-Auth": api_auth_token}
        )

    assert resp.status_code == 200
    response_competition = resp.get_json()["data"]

    # Verify the competition instructions are included in the response
    assert len(response_competition["competition_instructions"]) > 0
    instruction = response_competition["competition_instructions"][0]
    assert instruction["file_name"] == competition.competition_instructions[0].file_name
    assert instruction["download_path"] == presigned_url
    assert "created_at" in instruction
    assert "updated_at" in instruction


def test_competition_get_with_cdn_instructions_200(
    client, api_auth_token, enable_factory_create, monkeypatch_session
):
    # Set the CDN URL environment variable
    monkeypatch_session.setenv("CDN_URL", "https://cdn.example.com")

    # Create a competition with instructions
    competition = CompetitionFactory.create(with_instruction=True)

    # Mock the download_path property for CompetitionInstruction
    cdn_url = "https://cdn.example.com/competition-instructions/file.pdf"
    with mock.patch(
        "src.db.models.competition_models.CompetitionInstruction.download_path", 
        new_callable=mock.PropertyMock,
        return_value=cdn_url,
    ):
        resp = client.get(
            f"/alpha/competitions/{competition.competition_id}", headers={"X-Auth": api_auth_token}
        )

    assert resp.status_code == 200
    response_competition = resp.get_json()["data"]

    # Verify the competition instructions are included in the response
    assert len(response_competition["competition_instructions"]) > 0
    instruction = response_competition["competition_instructions"][0]
    assert instruction["file_name"] == competition.competition_instructions[0].file_name
    assert instruction["download_path"] == cdn_url
    assert instruction["download_path"].startswith("https://cdn.")
    assert "created_at" in instruction
    assert "updated_at" in instruction


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
