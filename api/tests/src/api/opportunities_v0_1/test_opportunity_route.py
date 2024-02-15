import dataclasses

import pytest

from src.db.models.opportunity_models import (
    Opportunity,
    OpportunityAssistanceListing,
    OpportunitySummary,
)
from tests.src.db.models.factories import OpportunityFactory


@pytest.fixture
def truncate_opportunities(db_session):
    # Note that we can't just do db_session.query(Opportunity).delete() as the cascade deletes won't work automatically:
    # https://docs.sqlalchemy.org/en/20/orm/queryguide/dml.html#orm-queryguide-update-delete-caveats
    # but if we do it individually they will
    opportunities = db_session.query(Opportunity).all()
    for opp in opportunities:
        db_session.delete(opp)

    # Force the deletes to the DB
    db_session.commit()


@dataclasses.dataclass
class SearchExpectedValues:
    total_pages: int
    total_records: int

    response_record_count: int


def get_search_request(
    page_offset: int = 1,
    page_size: int = 5,
    order_by: str = "opportunity_id",
    sort_direction: str = "descending",
):
    req = {
        "pagination": {
            "page_offset": page_offset,
            "page_size": page_size,
            "order_by": order_by,
            "sort_direction": sort_direction,
        }
    }

    return req


#####################################
# Validation utils
#####################################


def validate_search_pagination(
    search_response: dict, search_request: dict, expected_values: SearchExpectedValues
):
    pagination_info = search_response["pagination_info"]
    assert pagination_info["page_offset"] == search_request["pagination"]["page_offset"]
    assert pagination_info["page_size"] == search_request["pagination"]["page_size"]
    assert pagination_info["order_by"] == search_request["pagination"]["order_by"]
    assert pagination_info["sort_direction"] == search_request["pagination"]["sort_direction"]

    assert pagination_info["total_pages"] == expected_values.total_pages
    assert pagination_info["total_records"] == expected_values.total_records

    searched_opportunities = search_response["data"]
    assert len(searched_opportunities) == expected_values.response_record_count

    # Verify data is sorted as expected
    reverse = pagination_info["sort_direction"] == "descending"
    resorted_opportunities = sorted(
        searched_opportunities, key=lambda u: u[pagination_info["order_by"]], reverse=reverse
    )
    assert resorted_opportunities == searched_opportunities


def validate_opportunity(db_opportunity: Opportunity, resp_opportunity: dict):
    assert db_opportunity.opportunity_id == resp_opportunity["opportunity_id"]
    assert db_opportunity.opportunity_number == resp_opportunity["opportunity_number"]
    assert db_opportunity.opportunity_title == resp_opportunity["opportunity_title"]
    assert db_opportunity.agency == resp_opportunity["agency"]
    assert db_opportunity.category == resp_opportunity["category"]
    assert db_opportunity.category_explanation == resp_opportunity["category_explanation"]
    assert db_opportunity.revision_number == resp_opportunity["revision_number"]
    assert db_opportunity.modified_comments == resp_opportunity["modified_comments"]

    validate_opportunity_summary(db_opportunity.summary, resp_opportunity["summary"])
    validate_assistance_listings(
        db_opportunity.opportunity_assistance_listings,
        resp_opportunity["opportunity_assistance_listings"],
    )

    assert set(db_opportunity.funding_instruments) == set(resp_opportunity["funding_instruments"])
    assert set(db_opportunity.funding_categories) == set(resp_opportunity["funding_categories"])
    assert set(db_opportunity.applicant_types) == set(resp_opportunity["applicant_types"])


def validate_opportunity_summary(db_summary: OpportunitySummary, resp_summary: dict):
    if db_summary is None:
        assert resp_summary is None
        return

    assert db_summary.opportunity_status == resp_summary["opportunity_status"]
    assert db_summary.summary_description == resp_summary["summary_description"]
    assert db_summary.is_cost_sharing == resp_summary["is_cost_sharing"]
    assert str(db_summary.close_date) == resp_summary["close_date"]
    assert db_summary.close_date_description == resp_summary["close_date_description"]
    assert str(db_summary.post_date) == resp_summary["post_date"]
    assert str(db_summary.archive_date) == resp_summary["archive_date"]
    assert db_summary.expected_number_of_awards == resp_summary["expected_number_of_awards"]
    assert (
        db_summary.estimated_total_program_funding
        == resp_summary["estimated_total_program_funding"]
    )
    assert db_summary.award_floor == resp_summary["award_floor"]
    assert db_summary.award_ceiling == resp_summary["award_ceiling"]
    assert db_summary.additional_info_url == resp_summary["additional_info_url"]
    assert (
        db_summary.additional_info_url_description
        == resp_summary["additional_info_url_description"]
    )
    assert db_summary.funding_category_description == resp_summary["funding_category_description"]
    assert (
        db_summary.applicant_eligibility_description
        == resp_summary["applicant_eligibility_description"]
    )

    assert db_summary.agency_code == resp_summary["agency_code"]
    assert db_summary.agency_name == resp_summary["agency_name"]
    assert db_summary.agency_phone_number == resp_summary["agency_phone_number"]
    assert db_summary.agency_contact_description == resp_summary["agency_contact_description"]
    assert db_summary.agency_email_address == resp_summary["agency_email_address"]
    assert (
        db_summary.agency_email_address_description
        == resp_summary["agency_email_address_description"]
    )


def validate_assistance_listings(
    db_assistance_listings: list[OpportunityAssistanceListing], resp_listings: list[dict]
) -> None:
    # In order to compare this list, sort them both the same and compare from there
    db_assistance_listings.sort(key=lambda a: (a.assistance_listing_number, a.program_title))
    resp_listings.sort(key=lambda a: (a["assistance_listing_number"], a["program_title"]))

    assert len(db_assistance_listings) == len(resp_listings)
    for db_assistance_listing, resp_listing in zip(
        db_assistance_listings, resp_listings, strict=True
    ):
        assert (
            db_assistance_listing.assistance_listing_number
            == resp_listing["assistance_listing_number"]
        )
        assert db_assistance_listing.program_title == resp_listing["program_title"]


#####################################
# Search opportunities tests
#####################################


@pytest.mark.parametrize(
    "search_request,expected_values",
    [
        # Verifying page offset and size work properly
        (
            get_search_request(page_offset=1, page_size=5),
            SearchExpectedValues(total_pages=2, total_records=10, response_record_count=5),
        ),
        (
            get_search_request(page_offset=2, page_size=3),
            SearchExpectedValues(total_pages=4, total_records=10, response_record_count=3),
        ),
        (
            get_search_request(page_offset=3, page_size=4),
            SearchExpectedValues(total_pages=3, total_records=10, response_record_count=2),
        ),
        (
            get_search_request(page_offset=10, page_size=1),
            SearchExpectedValues(total_pages=10, total_records=10, response_record_count=1),
        ),
        (
            get_search_request(page_offset=100, page_size=5),
            SearchExpectedValues(total_pages=2, total_records=10, response_record_count=0),
        ),
        # Sorting
        (
            get_search_request(order_by="opportunity_id", sort_direction="ascending"),
            SearchExpectedValues(total_pages=2, total_records=10, response_record_count=5),
        ),
        (
            get_search_request(order_by="opportunity_number", sort_direction="descending"),
            SearchExpectedValues(total_pages=2, total_records=10, response_record_count=5),
        ),
    ],
)
def test_opportunity_search_paging_and_sorting_200(
    client,
    api_auth_token,
    enable_factory_create,
    search_request,
    expected_values,
    truncate_opportunities,
):
    # This test is just focused on testing the sorting and pagination
    OpportunityFactory.create_batch(size=10)

    resp = client.post(
        "/v0.1/opportunities/search", json=search_request, headers={"X-Auth": api_auth_token}
    )

    search_response = resp.get_json()
    assert resp.status_code == 200

    validate_search_pagination(search_response, search_request, expected_values)


@pytest.mark.parametrize(
    "search_request,expected_response_data",
    [
        (
            {},
            [
                {
                    "field": "pagination",
                    "message": "Missing data for required field.",
                    "type": "required",
                },
            ],
        ),
        (
            get_search_request(page_offset=-1, page_size=-1),
            [
                {
                    "field": "pagination.page_size",
                    "message": "Must be greater than or equal to 1.",
                    "type": "min_or_max_value",
                },
                {
                    "field": "pagination.page_offset",
                    "message": "Must be greater than or equal to 1.",
                    "type": "min_or_max_value",
                },
            ],
        ),
        (
            get_search_request(order_by="fake_field", sort_direction="up"),
            [
                {
                    "field": "pagination.order_by",
                    "message": "Value must be one of: opportunity_id, opportunity_number",
                    "type": "invalid_choice",
                },
                {
                    "field": "pagination.sort_direction",
                    "message": "Must be one of: ascending, descending.",
                    "type": "invalid_choice",
                },
            ],
        ),
    ],
)
def test_opportunity_search_invalid_request_422(
    client, api_auth_token, search_request, expected_response_data
):
    resp = client.post(
        "/v0.1/opportunities/search", json=search_request, headers={"X-Auth": api_auth_token}
    )
    assert resp.status_code == 422

    print(resp.get_json())
    response_data = resp.get_json()["errors"]
    assert response_data == expected_response_data


#####################################
# GET opportunity tests
#####################################


@pytest.mark.parametrize(
    "factory_params",
    [
        {},
        # Set all the non-opportunity model objects to null/empty
        {
            "summary": None,
            "opportunity_assistance_listings": [],
            "link_funding_instruments": [],
            "link_funding_categories": [],
            "link_applicant_types": [],
        },
    ],
)
def test_get_opportunity_200(client, api_auth_token, enable_factory_create, factory_params):
    db_opportunity = OpportunityFactory.create(**factory_params)

    resp = client.get(
        f"/v0.1/opportunities/{db_opportunity.opportunity_id}", headers={"X-Auth": api_auth_token}
    )
    assert resp.status_code == 200
    response_data = resp.get_json()["data"]

    validate_opportunity(db_opportunity, response_data)


def test_get_opportunity_404_not_found(client, api_auth_token, truncate_opportunities):
    resp = client.get("/v0.1/opportunities/1", headers={"X-Auth": api_auth_token})
    assert resp.status_code == 404
    assert resp.get_json()["message"] == "Could not find Opportunity with ID 1"


def test_get_opportunity_404_not_found_is_draft(client, api_auth_token, enable_factory_create):
    # The endpoint won't return drafts, so this'll be a 404 despite existing
    opportunity = OpportunityFactory.create(is_draft=True)

    resp = client.get(
        f"/v0.1/opportunities/{opportunity.opportunity_id}", headers={"X-Auth": api_auth_token}
    )
    assert resp.status_code == 404
    assert (
        resp.get_json()["message"]
        == f"Could not find Opportunity with ID {opportunity.opportunity_id}"
    )


#####################################
# Auth tests
#####################################
@pytest.mark.parametrize(
    "method,url,body",
    [
        ("POST", "/v0.1/opportunities/search", get_search_request()),
        ("GET", "/v0.1/opportunities/1", None),
    ],
)
def test_opportunity_unauthorized_401(client, api_auth_token, method, url, body):
    # open is just the generic method that post/get/etc. call under the hood
    response = client.open(url, method=method, json=body, headers={"X-Auth": "incorrect token"})

    assert response.status_code == 401
    assert (
        response.get_json()["message"]
        == "The server could not verify that you are authorized to access the URL requested"
    )
