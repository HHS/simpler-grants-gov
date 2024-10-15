import pytest

from tests.src.api.opportunities_v1.conftest import validate_opportunity
from tests.src.db.models.factories import (
    CurrentOpportunitySummaryFactory,
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
    client, api_auth_token, enable_factory_create, opportunity_params, opportunity_summary_params
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
        f"/v1/opportunities/{db_opportunity.opportunity_id}", headers={"X-Auth": api_auth_token}
    )
    assert resp.status_code == 200
    response_data = resp.get_json()["data"]

    validate_opportunity(db_opportunity, response_data)


def test_get_opportunity_404_not_found(client, api_auth_token, truncate_opportunities):
    resp = client.get("/v1/opportunities/1", headers={"X-Auth": api_auth_token})
    assert resp.status_code == 404
    assert resp.get_json()["message"] == "Could not find Opportunity with ID 1"


def test_get_opportunity_404_not_found_is_draft(client, api_auth_token, enable_factory_create):
    # The endpoint won't return drafts, so this'll be a 404 despite existing
    opportunity = OpportunityFactory.create(is_draft=True)

    resp = client.get(
        f"/v1/opportunities/{opportunity.opportunity_id}", headers={"X-Auth": api_auth_token}
    )
    assert resp.status_code == 404
    assert (
        resp.get_json()["message"]
        == f"Could not find Opportunity with ID {opportunity.opportunity_id}"
    )
