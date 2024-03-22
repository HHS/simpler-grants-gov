import dataclasses
from datetime import date
from enum import IntEnum

import pytest

from src.constants.lookup_constants import (
    ApplicantType,
    FundingCategory,
    FundingInstrument,
    OpportunityStatus,
)
from src.db.models.opportunity_models import (
    Opportunity,
    OpportunityAssistanceListing,
    OpportunitySummary,
)
from src.util.dict_util import flatten_dict
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import (
    CurrentOpportunitySummaryFactory,
    LinkOpportunitySummaryApplicantTypeFactory,
    LinkOpportunitySummaryFundingCategoryFactory,
    LinkOpportunitySummaryFundingInstrumentFactory,
    OpportunityAssistanceListingFactory,
    OpportunityFactory,
    OpportunitySummaryFactory,
)


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
    query: str | None = None,
    funding_instrument_one_of: list[FundingInstrument] | None = None,
    funding_category_one_of: list[FundingCategory] | None = None,
    applicant_type_one_of: list[ApplicantType] | None = None,
    opportunity_status_one_of: list[OpportunityStatus] | None = None,
    agency_one_of: list[str] | None = None,
):
    req = {
        "pagination": {
            "page_offset": page_offset,
            "page_size": page_size,
            "order_by": order_by,
            "sort_direction": sort_direction,
        }
    }

    filters = {}

    if funding_instrument_one_of:
        filters["funding_instrument"] = {"one_of": funding_instrument_one_of}

    if funding_category_one_of:
        filters["funding_category"] = {"one_of": funding_category_one_of}

    if applicant_type_one_of:
        filters["applicant_type"] = {"one_of": applicant_type_one_of}

    if opportunity_status_one_of:
        filters["opportunity_status"] = {"one_of": opportunity_status_one_of}

    if agency_one_of:
        filters["agency"] = {"one_of": agency_one_of}

    if len(filters) > 0:
        req["filters"] = filters

    if query is not None:
        req["query"] = query

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

    validate_opportunity_summary(db_opportunity.summary, resp_opportunity["summary"])
    validate_assistance_listings(
        db_opportunity.opportunity_assistance_listings,
        resp_opportunity["opportunity_assistance_listings"],
    )

    assert db_opportunity.opportunity_status == resp_opportunity["opportunity_status"]


def validate_opportunity_summary(db_summary: OpportunitySummary, resp_summary: dict):
    if db_summary is None:
        assert resp_summary is None
        return

    assert db_summary.summary_description == resp_summary["summary_description"]
    assert db_summary.is_cost_sharing == resp_summary["is_cost_sharing"]
    assert db_summary.is_forecast == resp_summary["is_forecast"]
    assert str(db_summary.close_date) == str(resp_summary["close_date"])
    assert db_summary.close_date_description == resp_summary["close_date_description"]
    assert str(db_summary.post_date) == str(resp_summary["post_date"])
    assert str(db_summary.archive_date) == str(resp_summary["archive_date"])
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

    assert str(db_summary.forecasted_post_date) == str(resp_summary["forecasted_post_date"])
    assert str(db_summary.forecasted_close_date) == str(resp_summary["forecasted_close_date"])
    assert (
        db_summary.forecasted_close_date_description
        == resp_summary["forecasted_close_date_description"]
    )
    assert str(db_summary.forecasted_award_date) == str(resp_summary["forecasted_award_date"])
    assert str(db_summary.forecasted_project_start_date) == str(
        resp_summary["forecasted_project_start_date"]
    )
    assert db_summary.fiscal_year == resp_summary["fiscal_year"]

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

    assert set(db_summary.funding_instruments) == set(resp_summary["funding_instruments"])
    assert set(db_summary.funding_categories) == set(resp_summary["funding_categories"])
    assert set(db_summary.applicant_types) == set(resp_summary["applicant_types"])


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
        ### Verifying page offset and size work properly
        # In a few of these tests we specify all possible values
        # for a given filter. This is to make sure that the one-to-many
        # relationships don't cause the counts to get thrown off
        (
            get_search_request(
                page_offset=1, page_size=5, funding_instrument_one_of=[e for e in FundingInstrument]
            ),
            SearchExpectedValues(total_pages=2, total_records=10, response_record_count=5),
        ),
        (
            get_search_request(
                page_offset=2, page_size=3, funding_category_one_of=[e for e in FundingCategory]
            ),
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
    ],
)
def test_opportunity_search_paging_200(
    client,
    api_auth_token,
    enable_factory_create,
    search_request,
    expected_values,
    truncate_opportunities,
):
    # This test is just focused on testing the pagination
    OpportunityFactory.create_batch(size=10)

    resp = client.post(
        "/v0.1/opportunities/search", json=search_request, headers={"X-Auth": api_auth_token}
    )

    search_response = resp.get_json()
    assert resp.status_code == 200

    validate_search_pagination(search_response, search_request, expected_values)


def setup_pagination_scenario(
    opportunity_id: int,
    opportunity_number: str,
    opportunity_title: str,
    post_date: date,
    close_date: date | None,
    agency: str,
) -> None:
    opportunity = OpportunityFactory.create(
        opportunity_id=opportunity_id,
        opportunity_number=opportunity_number,
        opportunity_title=opportunity_title,
        agency=agency,
        no_current_summary=True,
    )

    opportunity_summary = OpportunitySummaryFactory.create(
        opportunity=opportunity, post_date=post_date, close_date=close_date
    )

    CurrentOpportunitySummaryFactory.create(
        opportunity=opportunity,
        opportunity_summary=opportunity_summary,
    )


class TestSearchPagination(BaseTestClass):
    @pytest.fixture(scope="class")
    def setup_scenarios(self, truncate_opportunities, enable_factory_create):
        setup_pagination_scenario(
            opportunity_id=1,
            opportunity_number="dddd",
            opportunity_title="zzzz",
            post_date=date(2024, 3, 1),
            close_date=None,
            agency="mmmm",
        )
        setup_pagination_scenario(
            opportunity_id=2,
            opportunity_number="eeee",
            opportunity_title="yyyy",
            post_date=date(2024, 2, 1),
            close_date=date(2024, 12, 1),
            agency="nnnn",
        )
        setup_pagination_scenario(
            opportunity_id=3,
            opportunity_number="aaaa",
            opportunity_title="wwww",
            post_date=date(2024, 5, 1),
            close_date=date(2024, 11, 1),
            agency="llll",
        )
        setup_pagination_scenario(
            opportunity_id=4,
            opportunity_number="bbbb",
            opportunity_title="uuuu",
            post_date=date(2024, 4, 1),
            close_date=date(2024, 10, 1),
            agency="kkkk",
        )
        setup_pagination_scenario(
            opportunity_id=5,
            opportunity_number="cccc",
            opportunity_title="xxxx",
            post_date=date(2024, 1, 1),
            close_date=date(2024, 9, 1),
            agency="oooo",
        )

    @pytest.mark.parametrize(
        "search_request,expected_order",
        [
            ### These various scenarios are setup so that the order will be different depending on the field
            ### See the set values in the above setup method
            # Opportunity ID
            (
                get_search_request(order_by="opportunity_id", sort_direction="ascending"),
                [1, 2, 3, 4, 5],
            ),
            (
                get_search_request(order_by="opportunity_id", sort_direction="descending"),
                [5, 4, 3, 2, 1],
            ),
            # Opportunity number
            (
                get_search_request(order_by="opportunity_number", sort_direction="ascending"),
                [3, 4, 5, 1, 2],
            ),
            (
                get_search_request(order_by="opportunity_number", sort_direction="descending"),
                [2, 1, 5, 4, 3],
            ),
            # Opportunity title
            (
                get_search_request(order_by="opportunity_title", sort_direction="ascending"),
                [4, 3, 5, 2, 1],
            ),
            (
                get_search_request(order_by="opportunity_title", sort_direction="descending"),
                [1, 2, 5, 3, 4],
            ),
            # Post date
            (get_search_request(order_by="post_date", sort_direction="ascending"), [5, 2, 1, 4, 3]),
            (
                get_search_request(order_by="post_date", sort_direction="descending"),
                [3, 4, 1, 2, 5],
            ),
            # Close date
            # note that opportunity id 1's value is null which always goes to the end regardless of direction
            (
                get_search_request(order_by="close_date", sort_direction="ascending"),
                [5, 4, 3, 2, 1],
            ),
            (
                get_search_request(order_by="close_date", sort_direction="descending"),
                [2, 3, 4, 5, 1],
            ),
            # Agency
            (
                get_search_request(order_by="agency_code", sort_direction="ascending"),
                [4, 3, 1, 2, 5],
            ),
            (
                get_search_request(order_by="agency_code", sort_direction="descending"),
                [5, 2, 1, 3, 4],
            ),
        ],
    )
    def test_opportunity_sorting_200(
        self, client, api_auth_token, search_request, expected_order, setup_scenarios
    ):
        resp = client.post(
            "/v0.1/opportunities/search", json=search_request, headers={"X-Auth": api_auth_token}
        )

        search_response = resp.get_json()
        assert resp.status_code == 200

        returned_opportunity_ids = [record["opportunity_id"] for record in search_response["data"]]

        assert returned_opportunity_ids == expected_order


#####################################
# Search opportunities tests (Scenarios)
#####################################


class Scenario(IntEnum):
    DRAFT_OPPORTUNITY = 0
    NO_CURRENT_SUMMARY = 1
    NO_CURRENT_SUMMARY_BUT_HAS_SUMMARY = 2

    # Scenarios where the opportunity status is set, but all other values are null/empty list
    POSTED_NULL_OTHER_VALUES = 3
    FORECASTED_NULL_OTHER_VALUES = 4
    CLOSED_NULL_OTHER_VALUES = 5
    ARCHIVED_NULL_OTHER_VALUES = 6

    # Posted opportunity status, has every enum value so will always appear when filtering by those
    POSTED_ALL_ENUM_VALUES = 7

    ### Various different scenarios, see where we generate these to get a better idea of what is set for each

    # Applicant types: State governments / county governments
    # Agency: DIFFERENT-ABC
    POSTED_NON_DEFAULT_AGENCY_WITH_APP_TYPES = 8

    # Funding instruments: Cooperative agreement / procurement contract
    # Funding categories: Health / food and nutrition
    FORECASTED_FUNDING_INSTRUMENTS_AND_CATEGORIES = 9

    # Funding categories: Food and nutrition / energy
    # Agency: DIFFERENT-XYZ
    CLOSED_NON_DEFAULT_AGENCY_WITH_FUNDING_CATEGORIES = 10

    # Funding instruments: grant
    # Applicant types: individuals
    ARCHIVED_ONLY_ONE_FUNDING_INSTRUMENT_ONE_APPLICANT_TYPE = 11

    # Funding instrument: Procurement contract
    # Funding category: environment
    # Applicant type: Small businesses
    POSTED_ONE_OF_EACH_ENUM = 12

    # Opportunity title has a percentage sign which we search against
    POSTED_OPPORTUNITY_TITLE_HAS_PERCENT = 13

    # Description has several random characters that we search against
    CLOSED_SUMMARY_DESCRIPTION_MANY_CHARACTERS = 14


def setup_opportunity(
    scenario: Scenario,
    /,  # all named params after this
    has_current_opportunity: bool = True,
    has_other_non_current_opportunity: bool = False,
    is_draft: bool = False,
    opportunity_title: str = "Default opportunity title",
    opportunity_number: str | None = None,
    opportunity_status: OpportunityStatus | None = OpportunityStatus.POSTED,
    summary_description: str = "Default summary description",
    funding_instruments: list[FundingInstrument] | None = None,
    funding_categories: list[FundingCategory] | None = None,
    applicant_types: list[ApplicantType] | None = None,
    agency: str | None = "DEFAULT-ABC",
    assistance_listings: list[tuple[str, str]] | None = None,
):
    if opportunity_number is None:
        opportunity_number = f"OPP-NUMBER-{scenario}"

    opportunity = OpportunityFactory.create(
        opportunity_id=scenario,
        no_current_summary=True,
        agency=agency,
        is_draft=is_draft,
        opportunity_title=opportunity_title,
        opportunity_number=opportunity_number,
    )

    if assistance_listings:
        for assistance_listing_number, program_title in assistance_listings:
            OpportunityAssistanceListingFactory.create(
                opportunity=opportunity,
                assistance_listing_number=assistance_listing_number,
                program_title=program_title,
            )

    if has_current_opportunity:
        opportunity_summary = OpportunitySummaryFactory.create(
            opportunity=opportunity,
            revision_number=2,
            no_link_values=True,
            summary_description=summary_description,
        )
        CurrentOpportunitySummaryFactory.create(
            opportunity=opportunity,
            opportunity_summary=opportunity_summary,
            opportunity_status=opportunity_status,
        )

        if funding_instruments:
            for funding_instrument in funding_instruments:
                LinkOpportunitySummaryFundingInstrumentFactory.create(
                    opportunity_summary=opportunity_summary, funding_instrument=funding_instrument
                )

        if funding_categories:
            for funding_category in funding_categories:
                LinkOpportunitySummaryFundingCategoryFactory.create(
                    opportunity_summary=opportunity_summary, funding_category=funding_category
                )

        if applicant_types:
            for applicant_type in applicant_types:
                LinkOpportunitySummaryApplicantTypeFactory.create(
                    opportunity_summary=opportunity_summary, applicant_type=applicant_type
                )

    if has_other_non_current_opportunity:
        OpportunitySummaryFactory.create(opportunity=opportunity, revision_number=1)


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
                    "message": "Value must be one of: opportunity_id, opportunity_number, opportunity_title, post_date, close_date, agency_code",
                    "type": "invalid_choice",
                },
                {
                    "field": "pagination.sort_direction",
                    "message": "Must be one of: ascending, descending.",
                    "type": "invalid_choice",
                },
            ],
        ),
        # The one_of enum filters
        (
            get_search_request(
                funding_instrument_one_of=["not_a_valid_value"],
                funding_category_one_of=["also_not_valid", "here_too"],
                applicant_type_one_of=["not_an_applicant_type"],
                opportunity_status_one_of=["also not real"],
            ),
            [
                {
                    "field": "filters.funding_instrument.one_of.0",
                    "message": f"Must be one of: {', '.join(FundingInstrument)}.",
                    "type": "invalid_choice",
                },
                {
                    "field": "filters.funding_category.one_of.0",
                    "message": f"Must be one of: {', '.join(FundingCategory)}.",
                    "type": "invalid_choice",
                },
                {
                    "field": "filters.funding_category.one_of.1",
                    "message": f"Must be one of: {', '.join(FundingCategory)}.",
                    "type": "invalid_choice",
                },
                {
                    "field": "filters.applicant_type.one_of.0",
                    "message": f"Must be one of: {', '.join(ApplicantType)}.",
                    "type": "invalid_choice",
                },
                {
                    "field": "filters.opportunity_status.one_of.0",
                    "message": f"Must be one of: {', '.join(OpportunityStatus)}.",
                    "type": "invalid_choice",
                },
            ],
        ),
        # Too short of agency
        (
            get_search_request(agency_one_of=["a"]),
            [
                {
                    "field": "filters.agency.one_of.0",
                    "message": "Shorter than minimum length 2.",
                    "type": "min_length",
                }
            ],
        ),
        # Too short of a query
        (
            get_search_request(query=""),
            [
                {
                    "field": "query",
                    "message": "Length must be between 1 and 100.",
                    "type": "min_or_max_length",
                }
            ],
        ),
        # Too long of a query
        (
            get_search_request(query="A" * 101),
            [
                {
                    "field": "query",
                    "message": "Length must be between 1 and 100.",
                    "type": "min_or_max_length",
                }
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


def search_scenario_id_fnc(val):
    # Because we have a lot of tests, having the ID output by pytest simply be
    # search_request11-expected_scenarios11
    # can be a bit difficult to follow. This method is attached to the tests in the
    # below class to try and roughly format the output into something readable to help
    # you find the test we want.
    #
    # Note that Pytest calls this method once for each parametrized value, so the list
    # represents the expected results, and the dict represents the search request object.
    if isinstance(val, list):
        return "Expected:" + ",".join([v.name for v in val])

    if isinstance(val, dict):
        # The pagination doesn't matter much for these tests
        # so exclude it from the test name ID
        copy_dict = val.copy()
        del copy_dict["pagination"]
        # Note that pytest seems to disallow periods in the ID names, so flatten
        # it using / instead
        return str(flatten_dict(copy_dict, separator="/"))

    # fallback in case we setup anything else to just use the value as is
    return val


class TestSearchScenarios(BaseTestClass):
    """
    Group the scenario tests in a class for performance. As the setup for these
    tests is slow, but can be shared across all of them, initialize them once
    and then run the tests. This reduced the runtime from ~30s to ~3s.
    """

    @pytest.fixture(scope="class")
    def setup_scenarios(self, truncate_opportunities, enable_factory_create):
        # Won't be returned ever because it's a draft opportunity
        setup_opportunity(Scenario.DRAFT_OPPORTUNITY, is_draft=True)

        # No summary / current to be queried against, never returned
        setup_opportunity(Scenario.NO_CURRENT_SUMMARY, has_current_opportunity=False)

        # Won't be returned in any results as there is no link in the current_opportunity_summary table
        setup_opportunity(
            Scenario.NO_CURRENT_SUMMARY_BUT_HAS_SUMMARY,
            has_current_opportunity=False,
            has_other_non_current_opportunity=True,
        )

        # These don't contain any agency or list values
        # The first one does have a non-current opportunity that isn't used
        setup_opportunity(
            Scenario.POSTED_NULL_OTHER_VALUES,
            opportunity_status=OpportunityStatus.POSTED,
            agency=None,
            has_other_non_current_opportunity=True,
        )
        setup_opportunity(
            Scenario.FORECASTED_NULL_OTHER_VALUES,
            opportunity_status=OpportunityStatus.FORECASTED,
            agency=None,
        )
        setup_opportunity(
            Scenario.CLOSED_NULL_OTHER_VALUES,
            opportunity_status=OpportunityStatus.CLOSED,
            agency=None,
        )
        setup_opportunity(
            Scenario.ARCHIVED_NULL_OTHER_VALUES,
            opportunity_status=OpportunityStatus.ARCHIVED,
            agency=None,
        )

        setup_opportunity(
            Scenario.POSTED_ALL_ENUM_VALUES,
            opportunity_status=OpportunityStatus.POSTED,
            opportunity_title="I have collected every enum known to humankind",
            funding_instruments=[e for e in FundingInstrument],
            funding_categories=[e for e in FundingCategory],
            applicant_types=[e for e in ApplicantType],
        )

        setup_opportunity(
            Scenario.POSTED_NON_DEFAULT_AGENCY_WITH_APP_TYPES,
            opportunity_status=OpportunityStatus.POSTED,
            opportunity_title="I have collected very few enum known to humankind",
            applicant_types=[ApplicantType.STATE_GOVERNMENTS, ApplicantType.COUNTY_GOVERNMENTS],
            agency="DIFFERENT-ABC",
        )

        setup_opportunity(
            Scenario.FORECASTED_FUNDING_INSTRUMENTS_AND_CATEGORIES,
            opportunity_status=OpportunityStatus.FORECASTED,
            funding_instruments=[
                FundingInstrument.COOPERATIVE_AGREEMENT,
                FundingInstrument.PROCUREMENT_CONTRACT,
            ],
            funding_categories=[FundingCategory.HEALTH, FundingCategory.FOOD_AND_NUTRITION],
        )

        setup_opportunity(
            Scenario.CLOSED_NON_DEFAULT_AGENCY_WITH_FUNDING_CATEGORIES,
            summary_description="I am a description for an opportunity",
            opportunity_status=OpportunityStatus.CLOSED,
            funding_categories=[FundingCategory.FOOD_AND_NUTRITION, FundingCategory.ENERGY],
            agency="DIFFERENT-XYZ",
        )

        setup_opportunity(
            Scenario.ARCHIVED_ONLY_ONE_FUNDING_INSTRUMENT_ONE_APPLICANT_TYPE,
            opportunity_status=OpportunityStatus.ARCHIVED,
            funding_instruments=[FundingInstrument.GRANT],
            applicant_types=[ApplicantType.INDIVIDUALS],
        )

        setup_opportunity(
            Scenario.POSTED_ONE_OF_EACH_ENUM,
            opportunity_status=OpportunityStatus.POSTED,
            funding_instruments=[FundingInstrument.PROCUREMENT_CONTRACT],
            funding_categories=[FundingCategory.ENVIRONMENT],
            applicant_types=[ApplicantType.SMALL_BUSINESSES],
        )

        setup_opportunity(
            Scenario.POSTED_OPPORTUNITY_TITLE_HAS_PERCENT,
            opportunity_title="Investigate 50% of everything",
            assistance_listings=[
                ("01.234", "The first example assistance listing"),
                ("56.78", "The second example assistance listing"),
            ],
        )

        setup_opportunity(
            Scenario.CLOSED_SUMMARY_DESCRIPTION_MANY_CHARACTERS,
            opportunity_status=OpportunityStatus.CLOSED,
            summary_description="/$!-/%^&hello*~%%%//%@#$",
            assistance_listings=[
                ("01.234", "The first example assistance listing"),
                ("99.999", "The third example assistance listing"),
            ],
        )

    @pytest.mark.parametrize(
        "search_request,expected_scenarios",
        [
            # No filters, should return everything returnable
            (
                get_search_request(page_size=25),
                [
                    s
                    for s in Scenario
                    if s
                    not in [
                        Scenario.DRAFT_OPPORTUNITY,
                        Scenario.NO_CURRENT_SUMMARY,
                        Scenario.NO_CURRENT_SUMMARY_BUT_HAS_SUMMARY,
                    ]
                ],
            ),
            ### Opportunity status tests
            # Just posted
            (
                get_search_request(
                    page_size=25, opportunity_status_one_of=[OpportunityStatus.POSTED]
                ),
                [
                    Scenario.POSTED_ONE_OF_EACH_ENUM,
                    Scenario.POSTED_ALL_ENUM_VALUES,
                    Scenario.POSTED_NULL_OTHER_VALUES,
                    Scenario.POSTED_NON_DEFAULT_AGENCY_WITH_APP_TYPES,
                    Scenario.POSTED_OPPORTUNITY_TITLE_HAS_PERCENT,
                ],
            ),
            # Just forecasted
            (
                get_search_request(
                    page_size=25, opportunity_status_one_of=[OpportunityStatus.FORECASTED]
                ),
                [
                    Scenario.FORECASTED_NULL_OTHER_VALUES,
                    Scenario.FORECASTED_FUNDING_INSTRUMENTS_AND_CATEGORIES,
                ],
            ),
            # Closed or archived
            (
                get_search_request(
                    page_size=25,
                    opportunity_status_one_of=[
                        OpportunityStatus.CLOSED,
                        OpportunityStatus.ARCHIVED,
                    ],
                ),
                [
                    Scenario.CLOSED_NULL_OTHER_VALUES,
                    Scenario.ARCHIVED_NULL_OTHER_VALUES,
                    Scenario.CLOSED_NON_DEFAULT_AGENCY_WITH_FUNDING_CATEGORIES,
                    Scenario.ARCHIVED_ONLY_ONE_FUNDING_INSTRUMENT_ONE_APPLICANT_TYPE,
                    Scenario.CLOSED_SUMMARY_DESCRIPTION_MANY_CHARACTERS,
                ],
            ),
            # Posted or forecasted
            (
                get_search_request(
                    page_size=25,
                    opportunity_status_one_of=[
                        OpportunityStatus.POSTED,
                        OpportunityStatus.FORECASTED,
                    ],
                ),
                [
                    Scenario.POSTED_ONE_OF_EACH_ENUM,
                    Scenario.POSTED_ALL_ENUM_VALUES,
                    Scenario.POSTED_NULL_OTHER_VALUES,
                    Scenario.POSTED_NON_DEFAULT_AGENCY_WITH_APP_TYPES,
                    Scenario.FORECASTED_NULL_OTHER_VALUES,
                    Scenario.FORECASTED_FUNDING_INSTRUMENTS_AND_CATEGORIES,
                    Scenario.POSTED_OPPORTUNITY_TITLE_HAS_PERCENT,
                ],
            ),
            ### Agency field tests (note that agency works as a prefix)
            ### By default agency is set to "DEFAULT-ABC" with a few overriding that to "DIFFERENT-<something>"
            # Should only return the agencies that start "DIFFERENT-" (case-insensitive)
            (
                get_search_request(page_size=25, agency_one_of=["DiFfErEnT"]),
                [
                    Scenario.POSTED_NON_DEFAULT_AGENCY_WITH_APP_TYPES,
                    Scenario.CLOSED_NON_DEFAULT_AGENCY_WITH_FUNDING_CATEGORIES,
                ],
            ),
            # Should not return anything as no agency begins with this
            (get_search_request(page_size=25, agency_one_of=["no agency starts with this"]), []),
            # Should only return a single agency as it's the only one that has this name
            (
                get_search_request(page_size=25, agency_one_of=["different-xyz"]),
                [Scenario.CLOSED_NON_DEFAULT_AGENCY_WITH_FUNDING_CATEGORIES],
            ),
            # Should return everything with agency set as it will be happy with both prefixes
            (
                get_search_request(page_size=25, agency_one_of=["DEFAULT", "different"]),
                [
                    Scenario.POSTED_ALL_ENUM_VALUES,
                    Scenario.POSTED_NON_DEFAULT_AGENCY_WITH_APP_TYPES,
                    Scenario.FORECASTED_FUNDING_INSTRUMENTS_AND_CATEGORIES,
                    Scenario.CLOSED_NON_DEFAULT_AGENCY_WITH_FUNDING_CATEGORIES,
                    Scenario.ARCHIVED_ONLY_ONE_FUNDING_INSTRUMENT_ONE_APPLICANT_TYPE,
                    Scenario.POSTED_ONE_OF_EACH_ENUM,
                    Scenario.POSTED_OPPORTUNITY_TITLE_HAS_PERCENT,
                    Scenario.CLOSED_SUMMARY_DESCRIPTION_MANY_CHARACTERS,
                ],
            ),
            ### Testing the one-to-many enum values
            ### By default we didn't set these values, so testing against only directly defined data
            # An applicant type we set, and one we only set on the "all" scenario.
            (
                get_search_request(
                    page_size=25,
                    applicant_type_one_of=[
                        ApplicantType.STATE_GOVERNMENTS,
                        ApplicantType.NONPROFITS_NON_HIGHER_EDUCATION_WITH_501C3,
                    ],
                ),
                [
                    Scenario.POSTED_ALL_ENUM_VALUES,
                    Scenario.POSTED_NON_DEFAULT_AGENCY_WITH_APP_TYPES,
                ],
            ),
            # A different applicant type set by a different scenario
            (
                get_search_request(page_size=25, applicant_type_one_of=[ApplicantType.INDIVIDUALS]),
                [
                    Scenario.POSTED_ALL_ENUM_VALUES,
                    Scenario.ARCHIVED_ONLY_ONE_FUNDING_INSTRUMENT_ONE_APPLICANT_TYPE,
                ],
            ),
            # Applicant types only set by the scenario that set every enum
            (
                get_search_request(
                    page_size=25,
                    applicant_type_one_of=[
                        ApplicantType.INDEPENDENT_SCHOOL_DISTRICTS,
                        ApplicantType.PUBLIC_AND_INDIAN_HOUSING_AUTHORITIES,
                    ],
                ),
                [Scenario.POSTED_ALL_ENUM_VALUES],
            ),
            # Procurement contract funding instrument was configured on a few
            (
                get_search_request(
                    page_size=25, funding_instrument_one_of=[FundingInstrument.PROCUREMENT_CONTRACT]
                ),
                [
                    Scenario.POSTED_ALL_ENUM_VALUES,
                    Scenario.FORECASTED_FUNDING_INSTRUMENTS_AND_CATEGORIES,
                    Scenario.POSTED_ONE_OF_EACH_ENUM,
                ],
            ),
            # Funding instrument only configured on the all-enum scenario
            (
                get_search_request(
                    page_size=25, funding_instrument_one_of=[FundingInstrument.OTHER]
                ),
                [Scenario.POSTED_ALL_ENUM_VALUES],
            ),
            # Multiple funding instruments gets everything we configured
            (
                get_search_request(
                    page_size=25,
                    funding_instrument_one_of=[
                        FundingInstrument.PROCUREMENT_CONTRACT,
                        FundingInstrument.GRANT,
                    ],
                ),
                [
                    Scenario.POSTED_ALL_ENUM_VALUES,
                    Scenario.FORECASTED_FUNDING_INSTRUMENTS_AND_CATEGORIES,
                    Scenario.POSTED_ONE_OF_EACH_ENUM,
                    Scenario.ARCHIVED_ONLY_ONE_FUNDING_INSTRUMENT_ONE_APPLICANT_TYPE,
                ],
            ),
            # A few scenarios set the food & nutrition funding category
            (
                get_search_request(
                    page_size=25, funding_category_one_of=[FundingCategory.FOOD_AND_NUTRITION]
                ),
                [
                    Scenario.POSTED_ALL_ENUM_VALUES,
                    Scenario.CLOSED_NON_DEFAULT_AGENCY_WITH_FUNDING_CATEGORIES,
                    Scenario.FORECASTED_FUNDING_INSTRUMENTS_AND_CATEGORIES,
                ],
            ),
            # Only the all-enum scenario sets any of these funding categories
            (
                get_search_request(
                    page_size=25,
                    funding_category_one_of=[
                        FundingCategory.ARTS,
                        FundingCategory.OPPORTUNITY_ZONE_BENEFITS,
                        FundingCategory.HUMANITIES,
                    ],
                ),
                [Scenario.POSTED_ALL_ENUM_VALUES],
            ),
            ### Various tests with multiple filters
            # Agency starts with different, and applicant type gives only a single result
            (
                get_search_request(
                    page_size=25,
                    agency_one_of=["different"],
                    applicant_type_one_of=[ApplicantType.COUNTY_GOVERNMENTS],
                ),
                [Scenario.POSTED_NON_DEFAULT_AGENCY_WITH_APP_TYPES],
            ),
            # Posted/forecasted opportunity with procurement funding instrument gives several
            (
                get_search_request(
                    page_size=25,
                    opportunity_status_one_of=[
                        OpportunityStatus.POSTED,
                        OpportunityStatus.FORECASTED,
                    ],
                    funding_instrument_one_of=[FundingInstrument.PROCUREMENT_CONTRACT],
                ),
                [
                    Scenario.POSTED_ALL_ENUM_VALUES,
                    Scenario.FORECASTED_FUNDING_INSTRUMENTS_AND_CATEGORIES,
                    Scenario.POSTED_ONE_OF_EACH_ENUM,
                ],
            ),
            # Passing us a filter with every enum value will return everything that has something set
            (
                get_search_request(
                    page_size=25,
                    funding_instrument_one_of=[e for e in FundingInstrument],
                    funding_category_one_of=[e for e in FundingCategory],
                    applicant_type_one_of=[e for e in ApplicantType],
                    opportunity_status_one_of=[e for e in OpportunityStatus],
                ),
                [Scenario.POSTED_ONE_OF_EACH_ENUM, Scenario.POSTED_ALL_ENUM_VALUES],
            ),
            # In addition to the all-enum scenario, the other two scenarios share no applicant type / funding instrument, but the search returns both as we query for both
            (
                get_search_request(
                    page_size=25,
                    applicant_type_one_of=[
                        ApplicantType.SMALL_BUSINESSES,
                        ApplicantType.INDIVIDUALS,
                    ],
                    funding_instrument_one_of=[
                        FundingInstrument.GRANT,
                        FundingInstrument.PROCUREMENT_CONTRACT,
                    ],
                ),
                [
                    Scenario.POSTED_ALL_ENUM_VALUES,
                    Scenario.ARCHIVED_ONLY_ONE_FUNDING_INSTRUMENT_ONE_APPLICANT_TYPE,
                    Scenario.POSTED_ONE_OF_EACH_ENUM,
                ],
            ),
            ### A few scenarios that are too specific to return anything
            (
                get_search_request(
                    page_size=25,
                    opportunity_status_one_of=[OpportunityStatus.ARCHIVED],
                    funding_instrument_one_of=[FundingInstrument.PROCUREMENT_CONTRACT],
                ),
                [],
            ),
            (
                get_search_request(
                    page_size=25,
                    opportunity_status_one_of=[OpportunityStatus.FORECASTED],
                    agency_one_of=["different"],
                ),
                [],
            ),
        ],
        ids=search_scenario_id_fnc,
    )
    def test_opportunity_search_filters_200(
        self, client, api_auth_token, search_request, expected_scenarios, setup_scenarios
    ):
        resp = client.post(
            "/v0.1/opportunities/search", json=search_request, headers={"X-Auth": api_auth_token}
        )

        search_response = resp.get_json()
        assert resp.status_code == 200

        self.validate_results(search_request, search_response, expected_scenarios)

    @pytest.mark.parametrize(
        "search_request,expected_scenarios",
        [
            ### Verify that passing in a percentage sign (which is used in ilike) works still
            (
                get_search_request(page_size=25, query="50% of everything"),
                [Scenario.POSTED_OPPORTUNITY_TITLE_HAS_PERCENT],
            ),
            (
                get_search_request(page_size=25, query="50%"),
                [Scenario.POSTED_OPPORTUNITY_TITLE_HAS_PERCENT],
            ),
            ### Can query against opportunity number (note it gets generated as OPP-NUMBER-{scenario} automatically)
            (
                get_search_request(
                    page_size=25,
                    query=f"OPP-NUMBER-{Scenario.CLOSED_NON_DEFAULT_AGENCY_WITH_FUNDING_CATEGORIES}",
                ),
                [Scenario.CLOSED_NON_DEFAULT_AGENCY_WITH_FUNDING_CATEGORIES],
            ),
            (
                get_search_request(
                    page_size=25,
                    query=f"NUMBER-{Scenario.ARCHIVED_ONLY_ONE_FUNDING_INSTRUMENT_ONE_APPLICANT_TYPE}",
                ),
                [Scenario.ARCHIVED_ONLY_ONE_FUNDING_INSTRUMENT_ONE_APPLICANT_TYPE],
            ),
            ### These all fetch the same description which has a lot of weird characters in it
            # just the readable part
            (
                get_search_request(page_size=25, query="hello"),
                [Scenario.CLOSED_SUMMARY_DESCRIPTION_MANY_CHARACTERS],
            ),
            # The whole thing
            (
                get_search_request(page_size=25, query="/$!-/%^&hello*~%%%//%@#$"),
                [Scenario.CLOSED_SUMMARY_DESCRIPTION_MANY_CHARACTERS],
            ),
            # part of it
            (
                get_search_request(page_size=25, query="*~%%%"),
                [Scenario.CLOSED_SUMMARY_DESCRIPTION_MANY_CHARACTERS],
            ),
            ### Can query against agency similar to the agency filter itself
            (
                get_search_request(page_size=25, query="diffeRENT"),
                [
                    Scenario.POSTED_NON_DEFAULT_AGENCY_WITH_APP_TYPES,
                    Scenario.CLOSED_NON_DEFAULT_AGENCY_WITH_FUNDING_CATEGORIES,
                ],
            ),
            (
                get_search_request(page_size=25, query="diffeRENT-xYz"),
                [Scenario.CLOSED_NON_DEFAULT_AGENCY_WITH_FUNDING_CATEGORIES],
            ),
            ### Assistance listing number + program title queries
            (
                get_search_request(page_size=25, query="01.234"),
                [
                    Scenario.POSTED_OPPORTUNITY_TITLE_HAS_PERCENT,
                    Scenario.CLOSED_SUMMARY_DESCRIPTION_MANY_CHARACTERS,
                ],
            ),
            (
                get_search_request(page_size=25, query="56.78"),
                [Scenario.POSTED_OPPORTUNITY_TITLE_HAS_PERCENT],
            ),
            (
                get_search_request(page_size=25, query="99.999"),
                [Scenario.CLOSED_SUMMARY_DESCRIPTION_MANY_CHARACTERS],
            ),
            (
                get_search_request(page_size=25, query="example assistance listing"),
                [
                    Scenario.POSTED_OPPORTUNITY_TITLE_HAS_PERCENT,
                    Scenario.CLOSED_SUMMARY_DESCRIPTION_MANY_CHARACTERS,
                ],
            ),
            (
                get_search_request(page_size=25, query="second example"),
                [Scenario.POSTED_OPPORTUNITY_TITLE_HAS_PERCENT],
            ),
            (
                get_search_request(page_size=25, query="the third example"),
                [Scenario.CLOSED_SUMMARY_DESCRIPTION_MANY_CHARACTERS],
            ),
            ### A few queries that return nothing as they're way too specific, even if they sort've overlap actual values
            (get_search_request(query="different types of words that are so specific"), []),
            (get_search_request(query="US-ABC DIFFERENT US-XYZ"), []),
            (get_search_request(query="01.234.56.78.99"), []),
            (get_search_request(query="the fourth example"), []),
        ],
        ids=search_scenario_id_fnc,
    )
    def test_opportunity_query_string_200(
        self, client, api_auth_token, search_request, expected_scenarios, setup_scenarios
    ):
        resp = client.post(
            "/v0.1/opportunities/search", json=search_request, headers={"X-Auth": api_auth_token}
        )

        search_response = resp.get_json()
        assert resp.status_code == 200

        self.validate_results(search_request, search_response, expected_scenarios)

    @pytest.mark.parametrize(
        "search_request,expected_scenarios",
        [
            # There are two forecasted records, but only one has an agency of "default-abc"
            (
                get_search_request(
                    page_size=25,
                    query="default-abc",
                    opportunity_status_one_of=[OpportunityStatus.FORECASTED],
                ),
                [Scenario.FORECASTED_FUNDING_INSTRUMENTS_AND_CATEGORIES],
            ),
            # There are a few opportunities with "humankind" in their title
            (
                get_search_request(
                    page_size=25,
                    query="humankind",
                    applicant_type_one_of=[
                        ApplicantType.STATE_GOVERNMENTS,
                        ApplicantType.FEDERALLY_RECOGNIZED_NATIVE_AMERICAN_TRIBAL_GOVERNMENTS,
                    ],
                ),
                [
                    Scenario.POSTED_ALL_ENUM_VALUES,
                    Scenario.POSTED_NON_DEFAULT_AGENCY_WITH_APP_TYPES,
                ],
            ),
            # Like the previous one, but the query is more specific and only gets one of the scenarios
            (
                get_search_request(
                    page_size=25,
                    query="very few enum known to humankind",
                    applicant_type_one_of=[
                        ApplicantType.STATE_GOVERNMENTS,
                        ApplicantType.FEDERALLY_RECOGNIZED_NATIVE_AMERICAN_TRIBAL_GOVERNMENTS,
                    ],
                ),
                [Scenario.POSTED_NON_DEFAULT_AGENCY_WITH_APP_TYPES],
            ),
            # Agency filtered by one_of, query hits something in the summary description
            (
                get_search_request(
                    page_size=25,
                    query="i am a description",
                    agency_one_of=["DIFFERENT-XYZ", "DIFFERENT-abc"],
                ),
                [Scenario.CLOSED_NON_DEFAULT_AGENCY_WITH_FUNDING_CATEGORIES],
            ),
            ### A few scenarios that don't return any results because filters/query make it too specific
            (
                get_search_request(
                    page_size=25,
                    query="humankind",
                    opportunity_status_one_of=[
                        OpportunityStatus.FORECASTED,
                        OpportunityStatus.CLOSED,
                        OpportunityStatus.ARCHIVED,
                    ],
                ),
                [],
            ),
            (
                get_search_request(
                    page_size=25,
                    query="different",
                    funding_instrument_one_of=[FundingInstrument.GRANT],
                ),
                [],
            ),
            (
                get_search_request(
                    page_size=25,
                    query="words that don't hit anything",
                    applicant_type_one_of=[
                        ApplicantType.STATE_GOVERNMENTS,
                        ApplicantType.FEDERALLY_RECOGNIZED_NATIVE_AMERICAN_TRIBAL_GOVERNMENTS,
                    ],
                ),
                [],
            ),
        ],
        ids=search_scenario_id_fnc,
    )
    def test_opportunity_query_and_filter_200(
        self, client, api_auth_token, search_request, expected_scenarios, setup_scenarios
    ):
        # Basically a combo of the above two tests, testing requests with both query text and filters set
        resp = client.post(
            "/v0.1/opportunities/search", json=search_request, headers={"X-Auth": api_auth_token}
        )

        search_response = resp.get_json()
        assert resp.status_code == 200

        self.validate_results(search_request, search_response, expected_scenarios)

    def validate_results(self, search_request, search_response, expected_scenarios):
        returned_scenarios = set([record["opportunity_id"] for record in search_response["data"]])
        expected_scenarios = set(expected_scenarios)

        if expected_scenarios != returned_scenarios:
            # Find the difference in the expected scenarios and print them nicely to make debugging this test easier

            scenarios_not_found = [
                Scenario(e).name for e in expected_scenarios - returned_scenarios
            ]
            scenarios_not_expected = [
                Scenario(e).name for e in returned_scenarios - expected_scenarios
            ]

            assert (
                expected_scenarios == returned_scenarios
            ), f"Scenarios did not match. Search did not return expected scenarios: {scenarios_not_found}, and returned extra scenarios: {scenarios_not_expected}"

        # Verify that the pagnation response makes sense
        expected_total_pages = 1
        expected_total_records = len(expected_scenarios)
        if expected_total_records == 0:
            # page count will be 0 for 0 results
            expected_total_pages = 0
        validate_search_pagination(
            search_response,
            search_request,
            SearchExpectedValues(
                total_pages=expected_total_pages,
                total_records=expected_total_records,
                response_record_count=expected_total_records,
            ),
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
