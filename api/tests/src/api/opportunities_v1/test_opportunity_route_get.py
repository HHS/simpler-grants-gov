import uuid

import pytest
import requests

import src.util.file_util as file_util
from tests.src.api.opportunities_v1.conftest import (
    validate_opportunity,
    validate_opportunity_with_attachments,
)
from tests.src.db.models.factories import (
    AgencyFactory,
    CompetitionFactory,
    CurrentOpportunitySummaryFactory,
    OpportunityAttachmentFactory,
    OpportunityFactory,
    OpportunitySummaryFactory,
)

#####################################
# GET opportunity tests
#####################################


@pytest.mark.parametrize(
    "opportunity_params,opportunity_summary_params",
    [
        ({}, {}),
        # Only an opportunity exists, no other connected records
        (
            {
                "opportunity_assistance_listings": [],
            },
            None,
        ),
        # Summary exists, but none of the list values set
        (
            {},
            {
                "link_funding_instruments": [],
                "link_funding_categories": [],
                "link_applicant_types": [],
            },
        ),
        # All possible values set to null/empty
        # Note this uses traits on the factories to handle setting everything
        ({"all_fields_null": True}, {"all_fields_null": True}),
    ],
)
def test_get_opportunity_200(
    client,
    api_auth_token,
    enable_factory_create,
    opportunity_params,
    opportunity_summary_params,
    user_api_key_id,
):
    # Split the setup of the opportunity from the opportunity summary to simplify the factory usage a bit
    db_opportunity = OpportunityFactory.create(
        **opportunity_params, current_opportunity_summary=None
    )  # We'll set the current opportunity below
    if opportunity_summary_params is not None:
        db_opportunity_summary = OpportunitySummaryFactory.create(
            **opportunity_summary_params, opportunity=db_opportunity
        )
        CurrentOpportunitySummaryFactory.create(
            opportunity=db_opportunity, opportunity_summary=db_opportunity_summary
        )

    resp = client.get(
        f"/v1/opportunities/{db_opportunity.opportunity_id}", headers={"X-API-Key": user_api_key_id}
    )
    assert resp.status_code == 200
    response_data = resp.get_json()["data"]

    validate_opportunity(db_opportunity, response_data)


# JWT version of the get opportunity 200 succeed case, regular endpoint
@pytest.mark.parametrize(
    "opportunity_params,opportunity_summary_params",
    [
        ({}, {}),
        # Only an opportunity exists, no other connected records
        (
            {
                "opportunity_assistance_listings": [],
            },
            None,
        ),
        # Summary exists, but none of the list values set
        (
            {},
            {
                "link_funding_instruments": [],
                "link_funding_categories": [],
                "link_applicant_types": [],
            },
        ),
        # All possible values set to null/empty
        # Note this uses traits on the factories to handle setting everything
        ({"all_fields_null": True}, {"all_fields_null": True}),
    ],
)
def test_get_opportunity_200_JWT(
    client, opportunity_params, opportunity_summary_params, user_auth_token
):
    # Split the setup of the opportunity from the opportunity summary to simplify the factory usage a bit
    db_opportunity = OpportunityFactory.create(
        **opportunity_params, current_opportunity_summary=None
    )  # We'll set the current opportunity below
    if opportunity_summary_params is not None:
        db_opportunity_summary = OpportunitySummaryFactory.create(
            **opportunity_summary_params, opportunity=db_opportunity
        )
        CurrentOpportunitySummaryFactory.create(
            opportunity=db_opportunity, opportunity_summary=db_opportunity_summary
        )

    resp = client.get(
        f"/v1/opportunities/{db_opportunity.opportunity_id}",
        headers={"X-SGG-Token": user_auth_token},
    )
    assert resp.status_code == 200
    response_data = resp.get_json()["data"]

    validate_opportunity(db_opportunity, response_data)


def test_get_opportunity_with_attachment_200(
    client, api_auth_token, enable_factory_create, db_session, user_api_key_id
):
    # Create an opportunity with an attachment
    opportunity = OpportunityFactory.create(has_attachments=True)
    db_session.commit()

    # Make the GET request
    resp = client.get(
        f"/v1/opportunities/{opportunity.opportunity_id}", headers={"X-API-Key": user_api_key_id}
    )

    # Check the response
    assert resp.status_code == 200
    response_data = resp.get_json()["data"]

    # Validate the opportunity data
    assert len(response_data["attachments"]) > 0
    validate_opportunity_with_attachments(opportunity, response_data)


def test_get_opportunity_with_attachment_200_legacy(
    client, api_auth_token, enable_factory_create, db_session, user_api_key_id
):
    # Create an opportunity with an attachment
    opportunity = OpportunityFactory.create(has_attachments=True)

    # Make the GET request
    resp = client.get(
        f"/v1/opportunities/{opportunity.legacy_opportunity_id}",
        headers={"X-API-Key": user_api_key_id},
    )

    # Check the response
    assert resp.status_code == 200
    response_data = resp.get_json()["data"]

    # Validate the opportunity data
    assert len(response_data["attachments"]) > 0
    validate_opportunity_with_attachments(opportunity, response_data)


# JWT version of the get opportunity with attachment, legacy endpoint
def test_get_opportunity_with_attachment_200_legacy_JWT(client, user_auth_token):
    # Create an opportunity with an attachment
    opportunity = OpportunityFactory.create(has_attachments=True)

    # Make the GET request
    resp = client.get(
        f"/v1/opportunities/{opportunity.legacy_opportunity_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    # Check the response
    assert resp.status_code == 200
    response_data = resp.get_json()["data"]

    # Validate the opportunity data
    assert len(response_data["attachments"]) > 0
    validate_opportunity_with_attachments(opportunity, response_data)


def test_get_opportunity_with_agency_200(
    client, api_auth_token, enable_factory_create, user_api_key_id
):
    parent_agency = AgencyFactory.create(agency_code="EXAMPLEAGENCYXYZ")
    child_agency = AgencyFactory.create(
        agency_code="EXAMPLEAGENCYXYZ-12345678", top_level_agency=parent_agency
    )

    opportunity = OpportunityFactory.create(agency_code=child_agency.agency_code)

    resp = client.get(
        f"/v1/opportunities/{opportunity.opportunity_id}", headers={"X-API-Key": user_api_key_id}
    )

    assert resp.status_code == 200
    response_data = resp.get_json()["data"]

    assert response_data["agency_code"] == child_agency.agency_code
    assert response_data["agency_name"] == child_agency.agency_name
    assert response_data["top_level_agency_name"] == parent_agency.agency_name


def test_get_opportunity_with_agency_200_legacy(
    client, api_auth_token, enable_factory_create, user_api_key_id
):
    parent_agency = AgencyFactory.create(agency_code="EXAMPLEAGENCYXYZ2")
    child_agency = AgencyFactory.create(
        agency_code="EXAMPLEAGENCYXYZ2-12345678", top_level_agency=parent_agency
    )

    opportunity = OpportunityFactory.create(agency_code=child_agency.agency_code)

    resp = client.get(
        f"/v1/opportunities/{opportunity.legacy_opportunity_id}",
        headers={"X-API-Key": user_api_key_id},
    )

    assert resp.status_code == 200
    response_data = resp.get_json()["data"]

    assert response_data["agency_code"] == child_agency.agency_code
    assert response_data["agency_name"] == child_agency.agency_name
    assert response_data["top_level_agency_name"] == parent_agency.agency_name


# JWT version of the get opportunity with agency, regular endpoint
def test_get_opportunity_with_agency_200_JWT(client, user_auth_token):
    parent_agency = AgencyFactory.create(agency_code="EXAMPLEAGENCYJWT")
    child_agency = AgencyFactory.create(
        agency_code="EXAMPLEAGENCYJWT-12345678", top_level_agency=parent_agency
    )

    opportunity = OpportunityFactory.create(agency_code=child_agency.agency_code)

    resp = client.get(
        f"/v1/opportunities/{opportunity.opportunity_id}", headers={"X-SGG-Token": user_auth_token}
    )

    assert resp.status_code == 200
    response_data = resp.get_json()["data"]

    assert response_data["agency_code"] == child_agency.agency_code
    assert response_data["agency_name"] == child_agency.agency_name
    assert response_data["top_level_agency_name"] == parent_agency.agency_name


def test_get_opportunity_s3_endpoint_url_200(
    client,
    api_auth_token,
    enable_factory_create,
    db_session,
    mock_s3_bucket,
    monkeypatch_session,
    user_api_key_id,
):
    # Reset the global _s3_config to ensure a fresh config is created
    monkeypatch_session.setattr(file_util, "_s3_config", None)

    # Create an opportunity with a specific attachment
    opportunity = OpportunityFactory.create(opportunity_attachments=[])
    object_name = "test_file_1.txt"
    file_loc = f"s3://{mock_s3_bucket}/{object_name}"
    OpportunityAttachmentFactory.create(
        file_location=file_loc, opportunity=opportunity, file_contents="Hello, world"
    )

    # Make the GET request
    resp = client.get(
        f"/v1/opportunities/{opportunity.opportunity_id}", headers={"X-API-Key": user_api_key_id}
    )

    # Check the response
    assert resp.status_code == 200
    response_data = resp.get_json()["data"]
    presigned_url = response_data["attachments"][0]["download_path"]

    # Validate pre-signed url
    response = requests.get(presigned_url, timeout=5)
    assert response.status_code == 200
    assert response.text == "Hello, world"


def test_get_opportunity_s3_endpoint_url_200_legacy(
    client,
    api_auth_token,
    enable_factory_create,
    db_session,
    mock_s3_bucket,
    monkeypatch_session,
    user_api_key_id,
):
    monkeypatch_session.delenv("CDN_URL", raising=False)
    # Create an opportunity with a specific attachment
    opportunity = OpportunityFactory.create(opportunity_attachments=[])
    object_name = "test_file_1.txt"
    file_loc = f"s3://{mock_s3_bucket}/{object_name}"
    OpportunityAttachmentFactory.create(
        file_location=file_loc, opportunity=opportunity, file_contents="Hello, world"
    )

    # Make the GET request
    resp = client.get(
        f"/v1/opportunities/{opportunity.legacy_opportunity_id}",
        headers={"X-API-Key": user_api_key_id},
    )

    # Check the response
    assert resp.status_code == 200
    response_data = resp.get_json()["data"]
    presigned_url = response_data["attachments"][0]["download_path"]

    # Validate pre-signed url
    response = requests.get(presigned_url, timeout=5)
    assert response.status_code == 200
    assert response.text == "Hello, world"


# JWT version of the get opportunity S3 endpoint url, legacy endpoint
def test_get_opportunity_s3_endpoint_url_200_legacy_JWT(
    client, mock_s3_bucket, monkeypatch_session, user_auth_token
):
    monkeypatch_session.delenv("CDN_URL", raising=False)
    # Create an opportunity with a specific attachment
    opportunity = OpportunityFactory.create(opportunity_attachments=[])
    object_name = "test_file_1.txt"
    file_loc = f"s3://{mock_s3_bucket}/{object_name}"
    OpportunityAttachmentFactory.create(
        file_location=file_loc, opportunity=opportunity, file_contents="Hello, world"
    )

    # Make the GET request
    resp = client.get(
        f"/v1/opportunities/{opportunity.legacy_opportunity_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    # Check the response
    assert resp.status_code == 200
    response_data = resp.get_json()["data"]
    presigned_url = response_data["attachments"][0]["download_path"]

    # Validate pre-signed url
    response = requests.get(presigned_url, timeout=5)
    assert response.status_code == 200
    assert response.text == "Hello, world"


def test_get_opportunity_404_not_found(client, user_api_key_id):
    opportunity_id = uuid.uuid4()
    resp = client.get(f"/v1/opportunities/{opportunity_id}", headers={"X-API-Key": user_api_key_id})
    assert resp.status_code == 404
    assert resp.get_json()["message"] == f"Could not find Opportunity with ID {opportunity_id}"


def test_get_opportunity_404_not_found_legacy(client, api_auth_token, user_api_key_id):
    resp = client.get("/v1/opportunities/1", headers={"X-API-Key": user_api_key_id})
    assert resp.status_code == 404
    assert resp.get_json()["message"] == "Could not find Opportunity with Legacy ID 1"


# JWT version of the get opportunity 404 not found, regular endpoint
def test_get_opportunity_404_not_found_JWT(client, user_auth_token):
    opportunity_id = uuid.uuid4()
    resp = client.get(
        f"/v1/opportunities/{opportunity_id}", headers={"X-SGG-Token": user_auth_token}
    )
    assert resp.status_code == 404
    assert resp.get_json()["message"] == f"Could not find Opportunity with ID {opportunity_id}"


def test_get_opportunity_404_not_found_is_draft(
    client, api_auth_token, enable_factory_create, user_api_key_id
):
    # The endpoint won't return drafts, so this'll be a 404 despite existing
    opportunity = OpportunityFactory.create(is_draft=True)

    resp = client.get(
        f"/v1/opportunities/{opportunity.opportunity_id}", headers={"X-API-Key": user_api_key_id}
    )
    assert resp.status_code == 404
    assert (
        resp.get_json()["message"]
        == f"Could not find Opportunity with ID {opportunity.opportunity_id}"
    )


def test_get_opportunity_404_not_found_is_draft_legacy(
    client, api_auth_token, enable_factory_create, user_api_key_id
):
    # The endpoint won't return drafts, so this'll be a 404 despite existing
    opportunity = OpportunityFactory.create(is_draft=True)

    resp = client.get(
        f"/v1/opportunities/{opportunity.legacy_opportunity_id}",
        headers={"X-API-Key": user_api_key_id},
    )
    assert resp.status_code == 404
    assert (
        resp.get_json()["message"]
        == f"Could not find Opportunity with Legacy ID {opportunity.legacy_opportunity_id}"
    )


# JWT version of the get opportunity 404 not found is_draft, legacy endpoint
def test_get_opportunity_404_not_found_is_draft_legacy_JWT(client, user_auth_token):
    # The endpoint won't return drafts, so this'll be a 404 despite existing
    opportunity = OpportunityFactory.create(is_draft=True)

    resp = client.get(
        f"/v1/opportunities/{opportunity.legacy_opportunity_id}",
        headers={"X-SGG-Token": user_auth_token},
    )
    assert resp.status_code == 404
    assert (
        resp.get_json()["message"]
        == f"Could not find Opportunity with Legacy ID {opportunity.legacy_opportunity_id}"
    )


def test_get_opportunity_returns_cdn_urls(
    client,
    api_auth_token,
    monkeypatch_session,
    enable_factory_create,
    db_session,
    mock_s3_bucket,
    user_api_key_id,
):
    # Reset the global _s3_config to ensure a fresh config is created
    monkeypatch_session.setattr(file_util, "_s3_config", None)

    monkeypatch_session.setenv("CDN_URL", "https://cdn.example.com")
    """Test that S3 file locations are converted to CDN URLs in the response"""
    # Create an opportunity with a specific attachment
    opportunity = OpportunityFactory.create(opportunity_attachments=[])

    object_name = "test_file_1.txt"
    file_loc = f"s3://{mock_s3_bucket}/{object_name}"
    OpportunityAttachmentFactory.create(
        file_location=file_loc, opportunity=opportunity, file_contents="Hello, world"
    )

    # Make the GET request
    resp = client.get(
        f"/v1/opportunities/{opportunity.opportunity_id}", headers={"X-API-Key": user_api_key_id}
    )

    # Check the response
    assert resp.status_code == 200
    response_data = resp.get_json()["data"]

    # Verify attachment URL is a CDN URL
    assert len(response_data["attachments"]) == 1
    attachment = response_data["attachments"][0]

    assert attachment["download_path"].startswith("https://cdn.")
    assert "s3://" not in attachment["download_path"]


def test_get_opportunity_returns_cdn_urls_legacy(
    client,
    api_auth_token,
    monkeypatch_session,
    enable_factory_create,
    db_session,
    mock_s3_bucket,
    user_api_key_id,
):
    monkeypatch_session.setenv("CDN_URL", "https://cdn.example.com")
    """Test that S3 file locations are converted to CDN URLs in the response"""
    # Create an opportunity with a specific attachment
    opportunity = OpportunityFactory.create(opportunity_attachments=[])

    object_name = "test_file_1.txt"
    file_loc = f"s3://{mock_s3_bucket}/{object_name}"
    OpportunityAttachmentFactory.create(
        file_location=file_loc, opportunity=opportunity, file_contents="Hello, world"
    )

    # Make the GET request
    resp = client.get(
        f"/v1/opportunities/{opportunity.legacy_opportunity_id}",
        headers={"X-API-Key": user_api_key_id},
    )

    # Check the response
    assert resp.status_code == 200
    response_data = resp.get_json()["data"]

    # Verify attachment URL is a CDN URL
    assert len(response_data["attachments"]) == 1
    attachment = response_data["attachments"][0]

    assert attachment["download_path"].startswith("https://cdn.")
    assert "s3://" not in attachment["download_path"]


# JWT version of the get opportunity returns CDN URLs, regular endpoint
def test_get_opportunity_returns_cdn_urls_JWT(
    client, monkeypatch_session, mock_s3_bucket, user_auth_token
):
    # Reset the global _s3_config to ensure a fresh config is created
    monkeypatch_session.setattr(file_util, "_s3_config", None)

    monkeypatch_session.setenv("CDN_URL", "https://cdn.example.com")
    """Test that S3 file locations are converted to CDN URLs in the response"""
    # Create an opportunity with a specific attachment
    opportunity = OpportunityFactory.create(opportunity_attachments=[])

    object_name = "test_file_1.txt"
    file_loc = f"s3://{mock_s3_bucket}/{object_name}"
    OpportunityAttachmentFactory.create(
        file_location=file_loc, opportunity=opportunity, file_contents="Hello, world"
    )

    # Make the GET request
    resp = client.get(
        f"/v1/opportunities/{opportunity.opportunity_id}", headers={"X-SGG-Token": user_auth_token}
    )

    # Check the response
    assert resp.status_code == 200
    response_data = resp.get_json()["data"]

    # Verify attachment URL is a CDN URL
    assert len(response_data["attachments"]) == 1
    attachment = response_data["attachments"][0]

    assert attachment["download_path"].startswith("https://cdn.")
    assert "s3://" not in attachment["download_path"]


def test_get_opportunity_with_competitions_200(
    client, api_auth_token, enable_factory_create, db_session, user_api_key_id
):
    # Create an opportunity with a competition
    opportunity = OpportunityFactory.create()
    competition = CompetitionFactory.create(opportunity=opportunity)
    db_session.commit()

    # Make the GET request
    resp = client.get(
        f"/v1/opportunities/{opportunity.opportunity_id}", headers={"X-API-Key": user_api_key_id}
    )

    # Check the response
    assert resp.status_code == 200
    response_data = resp.get_json()["data"]

    # Validate the competitions data is included
    assert "competitions" in response_data
    assert len(response_data["competitions"]) == 1
    assert response_data["competitions"][0]["competition_id"] == str(competition.competition_id)
    assert response_data["competitions"][0]["opportunity_id"] == str(opportunity.opportunity_id)


# JWT version of the get opportunity with competitions, regular endpoint
def test_get_opportunity_with_competitions_200_JWT(client, db_session, user_auth_token):
    # Create an opportunity with a competition
    opportunity = OpportunityFactory.create()
    competition = CompetitionFactory.create(opportunity=opportunity)
    db_session.commit()

    # Make the GET request
    resp = client.get(
        f"/v1/opportunities/{opportunity.opportunity_id}", headers={"X-SGG-Token": user_auth_token}
    )

    # Check the response
    assert resp.status_code == 200
    response_data = resp.get_json()["data"]

    # Validate the competitions data is included
    assert "competitions" in response_data
    assert len(response_data["competitions"]) == 1
    assert response_data["competitions"][0]["competition_id"] == str(competition.competition_id)
    assert response_data["competitions"][0]["opportunity_id"] == str(opportunity.opportunity_id)
