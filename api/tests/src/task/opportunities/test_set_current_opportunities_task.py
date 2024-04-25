from dataclasses import dataclass
from datetime import date, timedelta

import pytest

from src.constants.lookup_constants import OpportunityStatus
from src.db.models.opportunity_models import CurrentOpportunitySummary, OpportunitySummary
from src.task.opportunities.set_current_opportunities_task import SetCurrentOpportunitiesTask
from src.util.datetime_util import get_now_us_eastern_date
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import (
    CurrentOpportunitySummaryFactory,
    OpportunityFactory,
    OpportunitySummaryFactory,
)

# All tests will use this date as the current date
CURRENT_DATE = date(2024, 3, 25)

# To avoid the need to define dates constantly below, create a few static dates here we can reuse
# that are more readable than many different dates
LAST_YEAR = date(2023, 3, 25)
LAST_MONTH = date(2024, 2, 25)
YESTERDAY = date(2024, 3, 24)
TOMORROW = date(2024, 3, 26)
NEXT_MONTH = date(2024, 4, 25)
NEXT_YEAR = date(2025, 4, 25)


######################################################
# Date sets for forecast and non-forecast summaries
######################################################
@dataclass
class SummaryInfo:
    is_forecast: bool = False
    post_date: date | None = None
    close_date: date | None = None
    archive_date: date | None = None


### Non-forecast
# No post date
NON_FORECAST_NONE_POST_DATE_1 = SummaryInfo(False, None, NEXT_MONTH, NEXT_YEAR)
NON_FORECAST_NONE_POST_DATE_2 = SummaryInfo(False, None, YESTERDAY, YESTERDAY)
NON_FORECAST_NONE_POST_DATE_3 = SummaryInfo(False, None, None, None)
# before post date
NON_FORECAST_BEFORE_POST_DATE_1 = SummaryInfo(False, TOMORROW, NEXT_MONTH, NEXT_YEAR)
NON_FORECAST_BEFORE_POST_DATE_2 = SummaryInfo(False, TOMORROW, None, NEXT_YEAR)
NON_FORECAST_BEFORE_POST_DATE_3 = SummaryInfo(False, TOMORROW, NEXT_MONTH, None)
NON_FORECAST_BEFORE_POST_DATE_4 = SummaryInfo(False, TOMORROW, None, None)
# on post date, before close date
NON_FORECAST_ON_POST_DATE_1 = SummaryInfo(False, CURRENT_DATE, NEXT_MONTH, NEXT_YEAR)
# after post date, before close date
NON_FORECAST_AFTER_POST_DATE_1 = SummaryInfo(False, YESTERDAY, NEXT_MONTH, NEXT_YEAR)
NON_FORECAST_AFTER_POST_DATE_2 = SummaryInfo(False, YESTERDAY, NEXT_MONTH, None)
# after post date, on close date
NON_FORECAST_ON_CLOSE_DATE_1 = SummaryInfo(False, YESTERDAY, CURRENT_DATE, NEXT_YEAR)
NON_FORECAST_ON_CLOSE_DATE_2 = SummaryInfo(False, YESTERDAY, CURRENT_DATE, None)
# after close date, before archive date
NON_FORECAST_AFTER_CLOSE_DATE_1 = SummaryInfo(False, LAST_MONTH, YESTERDAY, NEXT_MONTH)
NON_FORECAST_AFTER_CLOSE_DATE_2 = SummaryInfo(False, YESTERDAY, YESTERDAY, NEXT_MONTH)
NON_FORECAST_AFTER_CLOSE_DATE_3 = SummaryInfo(False, LAST_YEAR, LAST_MONTH, TOMORROW)
NON_FORECAST_AFTER_CLOSE_DATE_4 = SummaryInfo(False, LAST_YEAR, LAST_YEAR, None)
# after close date, on archive date
NON_FORECAST_ON_ARCHIVE_DATE_1 = SummaryInfo(False, LAST_YEAR, LAST_MONTH, CURRENT_DATE)
NON_FORECAST_ON_ARCHIVE_DATE_2 = SummaryInfo(False, LAST_YEAR, LAST_YEAR, CURRENT_DATE)
# after archive date
NON_FORECAST_AFTER_ARCHIVE_DATE_1 = SummaryInfo(False, LAST_YEAR, LAST_YEAR, YESTERDAY)
NON_FORECAST_AFTER_ARCHIVE_DATE_2 = SummaryInfo(False, LAST_YEAR, None, LAST_MONTH)

### Forecast scenarios (note these won't ever have a close date)
# Null post date
FORECAST_NONE_POST_DATE_1 = SummaryInfo(True, None, None, YESTERDAY)
FORECAST_NONE_POST_DATE_2 = SummaryInfo(True, None, None, None)
# before post date
FORECAST_BEFORE_POST_DATE_1 = SummaryInfo(True, TOMORROW, None, NEXT_MONTH)
FORECAST_BEFORE_POST_DATE_2 = SummaryInfo(True, NEXT_MONTH, None, None)
# on post date, before archive date
FORECAST_ON_POST_DATE_1 = SummaryInfo(True, CURRENT_DATE, None, NEXT_MONTH)
FORECAST_ON_POST_DATE_2 = SummaryInfo(True, CURRENT_DATE, None, None)
FORECAST_ON_POST_DATE_3 = SummaryInfo(True, CURRENT_DATE, None, TOMORROW)
# after post date, before archive date
FORECAST_AFTER_POST_DATE_1 = SummaryInfo(True, LAST_MONTH, None, NEXT_MONTH)
FORECAST_AFTER_POST_DATE_2 = SummaryInfo(True, LAST_YEAR, None, TOMORROW)
FORECAST_AFTER_POST_DATE_3 = SummaryInfo(True, LAST_MONTH, None, None)
# after post date, on archive date
FORECAST_ON_ARCHIVE_DATE_1 = SummaryInfo(True, LAST_MONTH, None, CURRENT_DATE)
FORECAST_ON_ARCHIVE_DATE_2 = SummaryInfo(True, LAST_YEAR, None, CURRENT_DATE)
# after archive date
FORECAST_AFTER_ARCHIVE_DATE_1 = SummaryInfo(True, LAST_MONTH, None, YESTERDAY)
FORECAST_AFTER_ARCHIVE_DATE_2 = SummaryInfo(True, LAST_YEAR, None, LAST_MONTH)


class OpportunityContainer:
    def __init__(self, is_draft: bool = False) -> None:
        self.opportunity = OpportunityFactory.create(no_current_summary=True, is_draft=is_draft)
        self.expected_current_summary: OpportunitySummary | None = None

    def with_summary(
        self,
        post_date: date | None = None,
        close_date: date | None = None,
        archive_date: date | None = None,
        is_forecast: bool = False,
        revision_number: int = 0,
        is_deleted: bool = False,
        is_expected_current: bool = False,
        is_already_current: bool = False,
    ):
        opportunity_summary = OpportunitySummaryFactory.create(
            opportunity=self.opportunity,
            post_date=post_date,
            close_date=close_date,
            archive_date=archive_date,
            is_forecast=is_forecast,
            revision_number=revision_number,
            is_deleted=is_deleted,
        )

        if is_expected_current:
            self.expected_current_summary = opportunity_summary

        if is_already_current:
            CurrentOpportunitySummaryFactory.create(
                opportunity=self.opportunity, opportunity_summary=opportunity_summary
            )

        return self


def validate_current_opportunity(
    db_session, container: OpportunityContainer, expected_status: OpportunityStatus | None
):
    current_opportunity_summary = (
        db_session.query(CurrentOpportunitySummary)
        .where(CurrentOpportunitySummary.opportunity_id == container.opportunity.opportunity_id)
        .one_or_none()
    )

    is_current_none = current_opportunity_summary is None
    is_none_expected = container.expected_current_summary is None

    assert (
        is_current_none == is_none_expected
    ), f"Expected current opportunity summary to be {container.expected_current_summary} but found {current_opportunity_summary}"

    if current_opportunity_summary is not None:
        assert expected_status == current_opportunity_summary.opportunity_status
        assert (
            current_opportunity_summary.opportunity_summary_id
            == container.expected_current_summary.opportunity_summary_id
        )


# These params are used by several tests below and represent
# scenarios with a single summary. Params are in order:
#   summary_info, expected_opportunity_status
SINGLE_SUMMARY_PARAMS = [
    ### Non-forecast scenarios
    # Null post date
    (NON_FORECAST_NONE_POST_DATE_1, None),
    (NON_FORECAST_NONE_POST_DATE_2, None),
    (NON_FORECAST_NONE_POST_DATE_3, None),
    # before post date
    (NON_FORECAST_BEFORE_POST_DATE_1, None),
    (NON_FORECAST_BEFORE_POST_DATE_2, None),
    (NON_FORECAST_BEFORE_POST_DATE_3, None),
    (NON_FORECAST_BEFORE_POST_DATE_4, None),
    # on post date, before close date
    (NON_FORECAST_ON_POST_DATE_1, OpportunityStatus.POSTED),
    # after post date, before close date
    (NON_FORECAST_AFTER_POST_DATE_1, OpportunityStatus.POSTED),
    (NON_FORECAST_AFTER_POST_DATE_2, OpportunityStatus.POSTED),
    # after post date, on close date
    (NON_FORECAST_ON_CLOSE_DATE_1, OpportunityStatus.POSTED),
    (NON_FORECAST_ON_CLOSE_DATE_2, OpportunityStatus.POSTED),
    # after close date, before archive date
    (NON_FORECAST_AFTER_CLOSE_DATE_1, OpportunityStatus.CLOSED),
    (NON_FORECAST_AFTER_CLOSE_DATE_2, OpportunityStatus.CLOSED),
    (NON_FORECAST_AFTER_CLOSE_DATE_3, OpportunityStatus.CLOSED),
    (NON_FORECAST_AFTER_CLOSE_DATE_4, OpportunityStatus.CLOSED),
    # after close date, on archive date
    (NON_FORECAST_ON_ARCHIVE_DATE_1, OpportunityStatus.CLOSED),
    (NON_FORECAST_ON_ARCHIVE_DATE_2, OpportunityStatus.CLOSED),
    # after archive date
    (NON_FORECAST_AFTER_ARCHIVE_DATE_1, OpportunityStatus.ARCHIVED),
    (NON_FORECAST_AFTER_ARCHIVE_DATE_2, OpportunityStatus.ARCHIVED),
    ### Forecast scenarios (note these won't ever have a close date)
    # Null post date
    (FORECAST_NONE_POST_DATE_1, None),
    (FORECAST_NONE_POST_DATE_2, None),
    # before post date
    (FORECAST_BEFORE_POST_DATE_1, None),
    (FORECAST_BEFORE_POST_DATE_2, None),
    # on post date, before archive date
    (FORECAST_ON_POST_DATE_1, OpportunityStatus.FORECASTED),
    (FORECAST_ON_POST_DATE_2, OpportunityStatus.FORECASTED),
    (FORECAST_ON_POST_DATE_3, OpportunityStatus.FORECASTED),
    # after post date, before archive date
    (FORECAST_AFTER_POST_DATE_1, OpportunityStatus.FORECASTED),
    (FORECAST_AFTER_POST_DATE_2, OpportunityStatus.FORECASTED),
    (FORECAST_AFTER_POST_DATE_3, OpportunityStatus.FORECASTED),
    # after post date, on archive date
    (FORECAST_ON_ARCHIVE_DATE_1, OpportunityStatus.FORECASTED),
    (FORECAST_ON_ARCHIVE_DATE_2, OpportunityStatus.FORECASTED),
    # after archive date
    (FORECAST_AFTER_ARCHIVE_DATE_1, OpportunityStatus.ARCHIVED),
    (FORECAST_AFTER_ARCHIVE_DATE_2, OpportunityStatus.ARCHIVED),
]


class TestProcessOpportunity(BaseTestClass):
    @pytest.fixture(scope="class", autouse=True)
    def shared_setup(self, truncate_opportunities, enable_factory_create):
        # Autouse fixture that exists just to call the above two fixtures so we don't
        # need to include it on every test described below.

        # Note that the truncate only occurs once before the tests run, not between each run
        pass

    @pytest.fixture
    def set_current_opportunities_task(self, db_session):
        return SetCurrentOpportunitiesTask(db_session, CURRENT_DATE)

    def test_process_opportunity_no_summaries(self, set_current_opportunities_task, db_session):
        container = OpportunityContainer()

        set_current_opportunities_task._process_opportunity(container.opportunity)
        validate_current_opportunity(db_session, container, None)

    @pytest.mark.parametrize(
        "summary_info,expected_opportunity_status",
        SINGLE_SUMMARY_PARAMS,
    )
    def test_single_summary_scenario(
        self,
        set_current_opportunities_task,
        db_session,
        summary_info,
        expected_opportunity_status,
    ):
        container = (
            OpportunityContainer()
            .with_summary(
                revision_number=1,
                is_forecast=summary_info.is_forecast,
                post_date=summary_info.post_date,
                close_date=summary_info.close_date,
                archive_date=summary_info.archive_date,
                is_expected_current=True if expected_opportunity_status is not None else False,
            )
            .with_summary(
                # this summary won't ever be chosen as its an older revision
                revision_number=0,
                is_forecast=summary_info.is_forecast,
                post_date=YESTERDAY,
                archive_date=YESTERDAY,
                is_already_current=True,
            )
        )

        set_current_opportunities_task._process_opportunity(container.opportunity)
        validate_current_opportunity(db_session, container, expected_opportunity_status)

    @pytest.mark.parametrize(
        "summary_info,expected_opportunity_status",
        SINGLE_SUMMARY_PARAMS,
    )
    def test_two_summary_scenarios_one_deleted(
        self, set_current_opportunities_task, db_session, summary_info, expected_opportunity_status
    ):
        # This is identical to the test_single_summary_scenario test above
        # but we always add a summary of the opposite is_forecasted value
        # with identical date values, however it is always marked as deleted and won't be used
        container = (
            OpportunityContainer()
            .with_summary(
                is_forecast=summary_info.is_forecast,
                post_date=summary_info.post_date,
                close_date=summary_info.close_date,
                archive_date=summary_info.archive_date,
                is_expected_current=True if expected_opportunity_status is not None else False,
            )
            .with_summary(
                is_forecast=not summary_info.is_forecast,
                post_date=summary_info.post_date,
                # technically forecasts won't have a close date, but it won't
                # get to that check in logic anyways, so doesn't matter here
                close_date=summary_info.close_date,
                archive_date=summary_info.archive_date,
                is_deleted=True,
            )
        )

        set_current_opportunities_task._process_opportunity(container.opportunity)
        validate_current_opportunity(db_session, container, expected_opportunity_status)

    @pytest.mark.parametrize(
        "expected_summary_info,other_summary_info,expected_opportunity_status",
        [
            ### Each of these scenarios includes one non-forecast, and one forecast summary
            ### As long as the non-forecast can be used (eg. after post date), it will always
            ### be chosen over the forecast.
            # Both null post dates
            (NON_FORECAST_NONE_POST_DATE_1, FORECAST_NONE_POST_DATE_1, None),
            (NON_FORECAST_NONE_POST_DATE_3, FORECAST_NONE_POST_DATE_2, None),
            # Both before post date
            (NON_FORECAST_BEFORE_POST_DATE_1, FORECAST_BEFORE_POST_DATE_1, None),
            (NON_FORECAST_BEFORE_POST_DATE_4, FORECAST_BEFORE_POST_DATE_2, None),
            (NON_FORECAST_BEFORE_POST_DATE_2, FORECAST_BEFORE_POST_DATE_1, None),
            # Forecast on/after post date, non-forecast before post date
            (
                FORECAST_ON_POST_DATE_1,
                NON_FORECAST_BEFORE_POST_DATE_1,
                OpportunityStatus.FORECASTED,
            ),
            (
                FORECAST_AFTER_POST_DATE_1,
                NON_FORECAST_BEFORE_POST_DATE_2,
                OpportunityStatus.FORECASTED,
            ),
            (
                FORECAST_ON_ARCHIVE_DATE_1,
                NON_FORECAST_BEFORE_POST_DATE_3,
                OpportunityStatus.FORECASTED,
            ),
            (
                FORECAST_ON_ARCHIVE_DATE_2,
                NON_FORECAST_BEFORE_POST_DATE_4,
                OpportunityStatus.FORECASTED,
            ),
            # Forecast after archive date, non-forecast before post date
            (
                FORECAST_AFTER_ARCHIVE_DATE_1,
                NON_FORECAST_BEFORE_POST_DATE_3,
                OpportunityStatus.ARCHIVED,
            ),
            (
                FORECAST_AFTER_ARCHIVE_DATE_2,
                NON_FORECAST_BEFORE_POST_DATE_2,
                OpportunityStatus.ARCHIVED,
            ),
            # Forecast any date, non-forecast before post date
            (NON_FORECAST_ON_POST_DATE_1, FORECAST_AFTER_POST_DATE_3, OpportunityStatus.POSTED),
            (NON_FORECAST_AFTER_POST_DATE_1, FORECAST_ON_POST_DATE_2, OpportunityStatus.POSTED),
            (NON_FORECAST_AFTER_POST_DATE_2, FORECAST_ON_ARCHIVE_DATE_1, OpportunityStatus.POSTED),
            (NON_FORECAST_ON_CLOSE_DATE_1, FORECAST_AFTER_POST_DATE_2, OpportunityStatus.POSTED),
            (NON_FORECAST_ON_CLOSE_DATE_2, FORECAST_ON_POST_DATE_3, OpportunityStatus.POSTED),
            (
                NON_FORECAST_AFTER_POST_DATE_2,
                FORECAST_AFTER_ARCHIVE_DATE_1,
                OpportunityStatus.POSTED,
            ),
            (NON_FORECAST_ON_CLOSE_DATE_2, FORECAST_AFTER_ARCHIVE_DATE_2, OpportunityStatus.POSTED),
            # Forecast any date, non-forecast after close date
            (NON_FORECAST_AFTER_CLOSE_DATE_1, FORECAST_ON_POST_DATE_1, OpportunityStatus.CLOSED),
            (NON_FORECAST_AFTER_CLOSE_DATE_1, FORECAST_ON_ARCHIVE_DATE_1, OpportunityStatus.CLOSED),
            (
                NON_FORECAST_AFTER_CLOSE_DATE_3,
                FORECAST_AFTER_ARCHIVE_DATE_2,
                OpportunityStatus.CLOSED,
            ),
            (NON_FORECAST_AFTER_CLOSE_DATE_4, FORECAST_AFTER_POST_DATE_3, OpportunityStatus.CLOSED),
            # Forecast any date, non-forecast after archive date
            (
                NON_FORECAST_AFTER_ARCHIVE_DATE_1,
                FORECAST_AFTER_POST_DATE_2,
                OpportunityStatus.ARCHIVED,
            ),
            (
                NON_FORECAST_AFTER_ARCHIVE_DATE_2,
                FORECAST_ON_POST_DATE_3,
                OpportunityStatus.ARCHIVED,
            ),
            (
                NON_FORECAST_AFTER_ARCHIVE_DATE_1,
                FORECAST_ON_ARCHIVE_DATE_1,
                OpportunityStatus.ARCHIVED,
            ),
            (
                NON_FORECAST_AFTER_ARCHIVE_DATE_2,
                FORECAST_AFTER_ARCHIVE_DATE_1,
                OpportunityStatus.ARCHIVED,
            ),
        ],
    )
    def test_two_scenarios_one_forecast_one_non(
        self,
        set_current_opportunities_task,
        db_session,
        expected_summary_info,
        other_summary_info,
        expected_opportunity_status,
    ):
        # This tests various scenarios where an opportunity has a forecast and non-forecasted
        # summary at various different dates.
        container = (
            OpportunityContainer()
            .with_summary(
                is_forecast=expected_summary_info.is_forecast,
                post_date=expected_summary_info.post_date,
                close_date=expected_summary_info.close_date,
                archive_date=expected_summary_info.archive_date,
                is_expected_current=True if expected_opportunity_status is not None else False,
                revision_number=5,
            )
            .with_summary(
                is_forecast=other_summary_info.is_forecast,
                post_date=other_summary_info.post_date,
                close_date=other_summary_info.close_date,
                archive_date=other_summary_info.archive_date,
                revision_number=5,
            )
            .with_summary(
                # Add another record of the same type as the expected, but an older revision
                # so it won't ever be picked
                revision_number=1,
                is_forecast=expected_summary_info.is_forecast,
                # but the fields within in always would lead to it being marked archived
                post_date=LAST_YEAR,
                close_date=LAST_MONTH,
                archive_date=YESTERDAY,
            )
            .with_summary(
                # Also add a record of the same type as the one we don't plan to pick
                # that would always be posted/forecasted if it were the most recent
                revision_number=2,
                post_date=YESTERDAY,
                archive_date=NEXT_YEAR,
            )
        )

        set_current_opportunities_task._process_opportunity(container.opportunity)
        validate_current_opportunity(db_session, container, expected_opportunity_status)


class TestSetCurrentOpportunitiesTaskRun(BaseTestClass):
    @pytest.fixture(scope="class", autouse=True)
    def shared_setup(self, truncate_opportunities, enable_factory_create):
        # Autouse fixture that exists just to call the above two fixtures so we don't
        # need to include it on every test described below.

        # Note that the truncate only occurs once before the tests run, not between each run
        pass

    @pytest.fixture
    def set_current_opportunities_task(self, db_session):
        return SetCurrentOpportunitiesTask(db_session, CURRENT_DATE)

    def test_run(self, db_session, set_current_opportunities_task):
        # Most of what we wanted to test was done in above tests
        # this just aims to test a few things on the class itself

        ### Setup a few scenarios
        # Basic posted scenario that needs to be added
        container1 = OpportunityContainer().with_summary(
            is_forecast=NON_FORECAST_AFTER_POST_DATE_2.is_forecast,
            post_date=NON_FORECAST_AFTER_POST_DATE_2.post_date,
            close_date=NON_FORECAST_AFTER_POST_DATE_2.close_date,
            archive_date=NON_FORECAST_AFTER_POST_DATE_2.archive_date,
            is_expected_current=True,
        )

        # Basic scenario where the existing summary doesn't need to be changed
        # but the opportunity status does (factory defaults to posted)
        container2 = OpportunityContainer().with_summary(
            is_forecast=FORECAST_AFTER_ARCHIVE_DATE_1.is_forecast,
            post_date=FORECAST_AFTER_ARCHIVE_DATE_1.post_date,
            close_date=FORECAST_AFTER_ARCHIVE_DATE_1.close_date,
            archive_date=FORECAST_AFTER_ARCHIVE_DATE_1.archive_date,
            is_expected_current=True,
            is_already_current=True,
        )

        # a scenario where it has no summaries
        container3 = OpportunityContainer()

        # A scenario where the existing current summary should be removed entirely
        # because it is deleted
        container4 = OpportunityContainer().with_summary(
            is_forecast=FORECAST_AFTER_POST_DATE_2.is_forecast,
            post_date=FORECAST_AFTER_POST_DATE_2.post_date,
            close_date=FORECAST_AFTER_POST_DATE_2.close_date,
            archive_date=FORECAST_AFTER_POST_DATE_2.archive_date,
            is_already_current=True,
            is_deleted=True,
        )

        # A scenario where the existing current summary should be switched to the other one
        container5 = (
            OpportunityContainer()
            .with_summary(
                is_forecast=FORECAST_AFTER_ARCHIVE_DATE_1.is_forecast,
                post_date=FORECAST_AFTER_ARCHIVE_DATE_1.post_date,
                close_date=FORECAST_AFTER_ARCHIVE_DATE_1.close_date,
                archive_date=FORECAST_AFTER_ARCHIVE_DATE_1.archive_date,
                is_already_current=True,
            )
            .with_summary(
                is_forecast=NON_FORECAST_ON_POST_DATE_1.is_forecast,
                post_date=NON_FORECAST_ON_POST_DATE_1.post_date,
                close_date=NON_FORECAST_ON_POST_DATE_1.close_date,
                archive_date=NON_FORECAST_ON_POST_DATE_1.archive_date,
                is_expected_current=True,
            )
        )

        set_current_opportunities_task.run()

        validate_current_opportunity(db_session, container1, OpportunityStatus.POSTED)
        validate_current_opportunity(db_session, container2, OpportunityStatus.ARCHIVED)
        validate_current_opportunity(db_session, container3, None)
        validate_current_opportunity(db_session, container4, None)
        validate_current_opportunity(db_session, container5, OpportunityStatus.POSTED)

        # Check a few basic metrics that should be set
        metrics = set_current_opportunities_task.metrics

        assert metrics[set_current_opportunities_task.Metrics.OPPORTUNITY_COUNT] == 5
        assert metrics[set_current_opportunities_task.Metrics.UNMODIFIED_OPPORTUNITY_COUNT] == 1
        assert metrics[set_current_opportunities_task.Metrics.MODIFIED_OPPORTUNITY_COUNT] == 4


def test_via_cli(cli_runner, db_session, enable_factory_create):
    # Simple test that just verifies that we can invoke the script via the CLI
    # note that the script will always use todays date as the current date, so we
    # need to generate the scenario from that instead

    today = get_now_us_eastern_date()

    # A basic posted scenario
    container1 = OpportunityContainer().with_summary(
        is_forecast=False,
        post_date=today - timedelta(days=10),
        close_date=today + timedelta(days=30),
        archive_date=today + timedelta(days=60),
        is_expected_current=True,
    )

    # a basic forecasted scenario with several past revisions
    container2 = (
        OpportunityContainer()
        .with_summary(
            is_forecast=True,
            post_date=today - timedelta(days=5),
            archive_date=today + timedelta(days=60),
            is_already_current=True,
            revision_number=2,
        )
        .with_summary(
            is_forecast=True,
            post_date=today - timedelta(days=5),
            archive_date=today + timedelta(days=60),
            revision_number=1,
        )
        .with_summary(
            is_forecast=True,
            post_date=today - timedelta(days=5),
            archive_date=today + timedelta(days=120),
            is_expected_current=True,
            revision_number=3,
        )
    )

    cli_runner.invoke(args=["task", "set-current-opportunities"])

    validate_current_opportunity(db_session, container1, OpportunityStatus.POSTED)
    validate_current_opportunity(db_session, container2, OpportunityStatus.FORECASTED)
