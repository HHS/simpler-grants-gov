from datetime import date

from tests.src.db.models.factories import OpportunityFactory, OpportunitySummaryHistoryBuilder


def validate_versions_returned(
    resp_json: dict, expected_forecasts: list, expected_non_forecasts: list
):
    forecasts = resp_json["data"]["forecasts"]
    non_forecasts = resp_json["data"]["non_forecasts"]

    forecast_versions = [f["version_number"] for f in forecasts]
    non_forecast_versions = [f["version_number"] for f in non_forecasts]

    assert forecast_versions == expected_forecasts
    assert non_forecast_versions == expected_non_forecasts


def test_get_opportunity_versions_200(client, api_auth_token, enable_factory_create):
    # Uneventful opportunity with forecasts and non-forecasts, each with some history, nothing filtered
    opportunity = (
        OpportunitySummaryHistoryBuilder()
        .add_forecast()
        .add_forecast_history()
        .add_non_forecast(is_current=True)
        .add_non_forecast_history()
        .add_non_forecast_history()
        .build()
    )

    resp = client.get(
        f"/v1/opportunities/{opportunity.opportunity_id}/versions",
        headers={"X-Auth": api_auth_token},
    )

    assert resp.status_code == 200
    validate_versions_returned(resp.get_json(), [2, 1], [3, 2, 1])


def test_get_opportunity_versions_200_no_summaries(client, api_auth_token, enable_factory_create):
    opportunity = OpportunityFactory.create(no_current_summary=True)

    resp = client.get(
        f"/v1/opportunities/{opportunity.opportunity_id}/versions",
        headers={"X-Auth": api_auth_token},
    )

    assert resp.status_code == 200
    validate_versions_returned(resp.get_json(), [], [])


def test_get_opportunity_versions_200_summaries_filtered(
    client, api_auth_token, enable_factory_create
):
    opportunity = (
        OpportunitySummaryHistoryBuilder()
        .add_forecast(post_date=date(2100, 1, 1))
        .add_forecast_history(post_date=date(2000, 1, 1))
        .add_non_forecast(post_date=None)
        .add_non_forecast_history(post_date=date(2000, 1, 1))
        .add_non_forecast_history(post_date=date(2000, 1, 1))
        .build()
    )

    resp = client.get(
        f"/v1/opportunities/{opportunity.opportunity_id}/versions",
        headers={"X-Auth": api_auth_token},
    )

    assert resp.status_code == 200
    validate_versions_returned(resp.get_json(), [], [])


def test_get_opportunity_versions_200_history_deleted(
    client, api_auth_token, enable_factory_create
):
    opportunity = (
        OpportunitySummaryHistoryBuilder()
        .add_forecast()
        .add_forecast_history()
        .add_forecast_history(is_deleted=True)  # Won't be returned
        .add_forecast_history()  # Won't be returned because successor deleted
        .add_non_forecast(is_current=True)
        .add_non_forecast_history()
        .add_non_forecast_history(is_deleted=True)  # Won't be returned because deleted
        .build()
    )

    resp = client.get(
        f"/v1/opportunities/{opportunity.opportunity_id}/versions",
        headers={"X-Auth": api_auth_token},
    )

    assert resp.status_code == 200
    validate_versions_returned(resp.get_json(), [4, 3], [3, 2])


def test_get_opportunity_versions_200_no_non_historical(
    client, api_auth_token, enable_factory_create
):
    opportunity = (
        OpportunitySummaryHistoryBuilder()
        .add_forecast_history(is_deleted=True)
        .add_forecast_history()
        .add_forecast_history(is_deleted=True)
        .add_non_forecast_history(is_deleted=True)
        .add_non_forecast_history()
        .build()
    )

    resp = client.get(
        f"/v1/opportunities/{opportunity.opportunity_id}/versions",
        headers={"X-Auth": api_auth_token},
    )

    assert resp.status_code == 200
    validate_versions_returned(resp.get_json(), [], [])


def test_get_opportunity_versions_200_history_missing_post_date(
    client, api_auth_token, enable_factory_create
):
    opportunity = (
        OpportunitySummaryHistoryBuilder()
        .add_forecast()
        .add_forecast_history(post_date=None)
        .add_non_forecast(is_current=True)
        .add_non_forecast_history()
        .add_non_forecast_history(post_date=None)
        .add_non_forecast_history()
        .add_non_forecast_history()
        .build()
    )

    resp = client.get(
        f"/v1/opportunities/{opportunity.opportunity_id}/versions",
        headers={"X-Auth": api_auth_token},
    )

    assert resp.status_code == 200
    validate_versions_returned(resp.get_json(), [2], [5, 4])


def test_get_opportunity_404_not_found(client, api_auth_token, truncate_opportunities):
    resp = client.get("/v1/opportunities/1/versions", headers={"X-Auth": api_auth_token})
    assert resp.status_code == 404
    assert resp.get_json()["message"] == "Could not find Opportunity with ID 1"


def test_get_opportunity_404_not_found_is_draft(client, api_auth_token, enable_factory_create):
    # The endpoint won't return drafts, so this'll be a 404 despite existing
    opportunity = OpportunityFactory.create(is_draft=True)

    resp = client.get(
        f"/v1/opportunities/{opportunity.opportunity_id}/versions",
        headers={"X-Auth": api_auth_token},
    )
    assert resp.status_code == 404
    assert (
        resp.get_json()["message"]
        == f"Could not find Opportunity with ID {opportunity.opportunity_id}"
    )
