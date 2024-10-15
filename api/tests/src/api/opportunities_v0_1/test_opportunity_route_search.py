from datetime import date
from enum import IntEnum

import pytest

from src.constants.lookup_constants import (
    ApplicantType,
    FundingCategory,
    FundingInstrument,
    OpportunityStatus,
)
from src.util.dict_util import flatten_dict
from tests.conftest import BaseTestClass
from tests.src.api.opportunities_v0_1.conftest import (
    get_search_request,
    setup_opportunity,
    validate_search_pagination,
)
from tests.src.db.models.factories import OpportunityFactory

#####################################
# Pagination and ordering tests
#####################################


class TestSearchPagination(BaseTestClass):
    @pytest.fixture(scope="class")
    def setup_scenarios(self, truncate_opportunities, enable_factory_create):
        # This test is just focused on testing the pagination
        # We don't need to worry about anything specific as there is no filtering
        OpportunityFactory.create_batch(size=10)

    @pytest.mark.parametrize(
        "search_request,expected_values",
        [
            ### Verifying page offset and size work properly
            # In a few of these tests we specify all possible values
            # for a given filter. This is to make sure that the one-to-many
            # relationships don't cause the counts to get thrown off
            (
                get_search_request(
                    page_offset=1,
                    page_size=5,
                    funding_instrument_one_of=[e for e in FundingInstrument],
                ),
                dict(total_pages=2, total_records=10, response_record_count=5),
            ),
            (
                get_search_request(
                    page_offset=2, page_size=3, funding_category_one_of=[e for e in FundingCategory]
                ),
                dict(total_pages=4, total_records=10, response_record_count=3),
            ),
            (
                get_search_request(page_offset=3, page_size=4),
                dict(total_pages=3, total_records=10, response_record_count=2),
            ),
            (
                get_search_request(page_offset=10, page_size=1),
                dict(total_pages=10, total_records=10, response_record_count=1),
            ),
            (
                get_search_request(page_offset=100, page_size=5),
                dict(total_pages=2, total_records=10, response_record_count=0),
            ),
        ],
    )
    def test_opportunity_search_paging_200(
        self,
        client,
        api_auth_token,
        enable_factory_create,
        search_request,
        expected_values,
        setup_scenarios,
    ):
        resp = client.post(
            "/v0.1/opportunities/search", json=search_request, headers={"X-Auth": api_auth_token}
        )

        search_response = resp.get_json()
        assert resp.status_code == 200

        validate_search_pagination(
            search_response,
            search_request,
            expected_values["total_pages"],
            expected_values["total_records"],
            expected_values["response_record_count"],
        )


class TestSearchOrdering(BaseTestClass):
    @pytest.fixture(scope="class")
    def setup_scenarios(self, truncate_opportunities, enable_factory_create):
        setup_opportunity(
            1,
            opportunity_number="dddd",
            opportunity_title="zzzz",
            post_date=date(2024, 3, 1),
            close_date=None,
            agency="mmmm",
        )
        setup_opportunity(
            2,
            opportunity_number="eeee",
            opportunity_title="yyyy",
            post_date=date(2024, 2, 1),
            close_date=date(2024, 12, 1),
            agency="nnnn",
        )
        setup_opportunity(
            3,
            opportunity_number="aaaa",
            opportunity_title="wwww",
            post_date=date(2024, 5, 1),
            close_date=date(2024, 11, 1),
            agency="llll",
        )
        setup_opportunity(
            4,
            opportunity_number="bbbb",
            opportunity_title="uuuu",
            post_date=date(2024, 4, 1),
            close_date=date(2024, 10, 1),
            agency="kkkk",
        )
        setup_opportunity(
            5,
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
# Search querying & filtering
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
            ### Agency field tests
            ### By default agency is set to "DEFAULT-ABC" with a few overriding that to "DIFFERENT-<something>"
            # Should only return the agencies that start "DIFFERENT-"
            (
                get_search_request(page_size=25, agency_one_of=["DIFFERENT-ABC", "DIFFERENT-XYZ"]),
                [
                    Scenario.POSTED_NON_DEFAULT_AGENCY_WITH_APP_TYPES,
                    Scenario.CLOSED_NON_DEFAULT_AGENCY_WITH_FUNDING_CATEGORIES,
                ],
            ),
            # Should not return anything as no agency begins with this
            (get_search_request(page_size=25, agency_one_of=["no agency starts with this"]), []),
            # Should only return a single agency as it's the only one that has this name
            (
                get_search_request(page_size=25, agency_one_of=["DIFFERENT-XYZ"]),
                [Scenario.CLOSED_NON_DEFAULT_AGENCY_WITH_FUNDING_CATEGORIES],
            ),
            # Should return everything with agency set as these are all the values we set
            (
                get_search_request(
                    page_size=25, agency_one_of=["DEFAULT-ABC", "DIFFERENT-ABC", "DIFFERENT-XYZ"]
                ),
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
                    agency_one_of=["DIFFERENT-ABC"],
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
                    agency_one_of=["DIFFERENT-ABC", "DIFFERENT-XYZ"],
                ),
                [],
            ),
        ],
        ids=search_scenario_id_fnc,
    )
    def test_opportunity_search_filters_200(
        self, client, api_auth_token, search_request, expected_scenarios, setup_scenarios
    ):
        self.query_and_validate_results(client, api_auth_token, search_request, expected_scenarios)

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
        self.query_and_validate_results(client, api_auth_token, search_request, expected_scenarios)

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
        self.query_and_validate_results(client, api_auth_token, search_request, expected_scenarios)

    def query_and_validate_results(
        self, client, api_auth_token, search_request, expected_scenarios
    ):
        resp = client.post(
            "/v0.1/opportunities/search", json=search_request, headers={"X-Auth": api_auth_token}
        )

        search_response = resp.get_json()
        assert resp.status_code == 200

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
            expected_total_pages=expected_total_pages,
            expected_total_records=expected_total_records,
            expected_response_record_count=expected_total_records,
        )


#####################################
# Request validation tests
#####################################


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
        # Verify that if the one_of lists are empty, we get a validation error
        (
            get_search_request(
                funding_instrument_one_of=[],
                funding_category_one_of=[],
                applicant_type_one_of=[],
                opportunity_status_one_of=[],
                agency_one_of=[],
            ),
            [
                {
                    "field": "filters.funding_instrument.one_of",
                    "message": "Shorter than minimum length 1.",
                    "type": "min_length",
                },
                {
                    "field": "filters.funding_category.one_of",
                    "message": "Shorter than minimum length 1.",
                    "type": "min_length",
                },
                {
                    "field": "filters.applicant_type.one_of",
                    "message": "Shorter than minimum length 1.",
                    "type": "min_length",
                },
                {
                    "field": "filters.opportunity_status.one_of",
                    "message": "Shorter than minimum length 1.",
                    "type": "min_length",
                },
                {
                    "field": "filters.agency.one_of",
                    "message": "Shorter than minimum length 1.",
                    "type": "min_length",
                },
            ],
        ),
        # Validate that if a filter is provided, but empty, we'll provide an exception
        # note that the get_search_request() method isn't great for constructing this particular
        # case - so we manually define the request instead
        (
            {
                "pagination": {
                    "page_offset": 1,
                    "page_size": 5,
                    "order_by": "opportunity_id",
                    "sort_direction": "descending",
                },
                "filters": {
                    "funding_instrument": {},
                    "funding_category": {},
                    "applicant_type": {},
                    "opportunity_status": {},
                    "agency": {},
                },
            },
            [
                {
                    "field": "filters.funding_instrument",
                    "message": "At least one filter rule must be provided.",
                    "type": "invalid",
                },
                {
                    "field": "filters.funding_category",
                    "message": "At least one filter rule must be provided.",
                    "type": "invalid",
                },
                {
                    "field": "filters.applicant_type",
                    "message": "At least one filter rule must be provided.",
                    "type": "invalid",
                },
                {
                    "field": "filters.opportunity_status",
                    "message": "At least one filter rule must be provided.",
                    "type": "invalid",
                },
                {
                    "field": "filters.agency",
                    "message": "At least one filter rule must be provided.",
                    "type": "invalid",
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

    response_data = resp.get_json()["errors"]
    assert response_data == expected_response_data
