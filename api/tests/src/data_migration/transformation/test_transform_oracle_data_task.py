from typing import Tuple

import pytest

from src.constants.lookup_constants import ApplicantType
from src.data_migration.transformation.transform_oracle_data_task import TransformOracleDataTask
from src.db.models.opportunity_models import (
    Opportunity,
    OpportunityAssistanceListing,
    OpportunitySummary, LinkOpportunitySummaryApplicantType,
)
from src.db.models.staging.forecast import TforecastHist, TapplicanttypesForecastHist
from src.db.models.staging.opportunity import Topportunity, TopportunityCfda
from src.db.models.staging.synopsis import Tsynopsis, TsynopsisHist, TapplicanttypesSynopsis, TapplicanttypesSynopsisHist
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import (
    OpportunityAssistanceListingFactory,
    OpportunityFactory,
    OpportunitySummaryFactory,
    StagingTforecastFactory,
    StagingTforecastHistFactory,
    StagingTopportunityCfdaFactory,
    StagingTopportunityFactory,
    StagingTsynopsisFactory,
    StagingTsynopsisHistFactory, StagingTapplicanttypesForecastFactory, StagingTapplicanttypesForecastHistFactory, LinkOpportunitySummaryApplicantTypeFactory, StagingTapplicanttypesSynopsisFactory,
    StagingTapplicanttypesSynopsisHistFactory,
)
from sqlalchemy import and_


def setup_opportunity(
    create_existing: bool,
    is_delete: bool = False,
    is_already_processed: bool = False,
    source_values: dict | None = None,
    all_fields_null: bool = False,
) -> Topportunity:
    if source_values is None:
        source_values = {}

    source_opportunity = StagingTopportunityFactory.create(
        **source_values,
        is_deleted=is_delete,
        already_transformed=is_already_processed,
        all_fields_null=all_fields_null,
        cfdas=[],
    )

    if create_existing:
        OpportunityFactory.create(
            opportunity_id=source_opportunity.opportunity_id,
            # set created_at/updated_at to an earlier time so its clear
            # when they were last updated
            timestamps_in_past=True,
        )

    return source_opportunity


def setup_cfda(
    create_existing: bool,
    is_delete: bool = False,
    is_already_processed: bool = False,
    source_values: dict | None = None,
    all_fields_null: bool = False,
    opportunity: Opportunity | None = None,
) -> TopportunityCfda:
    if source_values is None:
        source_values = {}

    # If you don't provide an opportunity, you need to provide an ID
    if opportunity is not None:
        source_values["opportunity_id"] = opportunity.opportunity_id

    source_cfda = StagingTopportunityCfdaFactory.create(
        **source_values,
        opportunity=None,  # To override the factory trying to create something
        is_deleted=is_delete,
        already_transformed=is_already_processed,
        all_fields_null=all_fields_null,
    )

    if create_existing:
        OpportunityAssistanceListingFactory.create(
            opportunity=opportunity,
            opportunity_assistance_listing_id=source_cfda.opp_cfda_id,
            # set created_at/updated_at to an earlier time so its clear
            # when they were last updated
            timestamps_in_past=True,
        )

    return source_cfda


def setup_synopsis_forecast(
    is_forecast: bool,
    revision_number: int | None,
    create_existing: bool,
    opportunity: Opportunity,
    is_delete: bool = False,
    is_already_processed: bool = False,
    source_values: dict | None = None,
):
    if source_values is None:
        source_values = {}

    if is_forecast:
        if revision_number is None:
            factory_cls = StagingTforecastFactory
        else:
            factory_cls = StagingTforecastHistFactory
    else:
        if revision_number is None:
            factory_cls = StagingTsynopsisFactory
        else:
            factory_cls = StagingTsynopsisHistFactory

    if revision_number is not None:
        source_values["revision_number"] = revision_number

    source_summary = factory_cls.create(
        **source_values,
        opportunity=None,  # To override the factory trying to create something
        opportunity_id=opportunity.opportunity_id,
        is_deleted=is_delete,
        already_transformed=is_already_processed,
    )

    if create_existing:
        OpportunitySummaryFactory.create(
            opportunity=opportunity, is_forecast=is_forecast, revision_number=revision_number
        )

    return source_summary


def setup_applicant_type(
    create_existing: bool,
    opportunity_summary: OpportunitySummary,
    legacy_lookup_value: str,
    applicant_type: ApplicantType | None = None,
    is_delete: bool = False,
    is_already_processed: bool = False,
    source_values: dict | None = None,
):
    if create_existing and is_delete is False and applicant_type is None:
        raise Exception("If create_existing is True, is_delete is False - must provide the properly converted / mapped value for applicant_type")

    if source_values is None:
        source_values = {}

    if opportunity_summary.is_forecast:
        source_values["forecast"] = None
        if opportunity_summary.revision_number is None:
            factory_cls = StagingTapplicanttypesForecastFactory
        else:
            factory_cls = StagingTapplicanttypesForecastHistFactory
            source_values["revision_number"] = opportunity_summary.revision_number
    else:
        source_values["synopsis"] = None
        if opportunity_summary.revision_number is None:
            factory_cls = StagingTapplicanttypesSynopsisFactory
        else:
            factory_cls = StagingTapplicanttypesSynopsisHistFactory
            source_values["revision_number"] = opportunity_summary.revision_number

    source_applicant_type = factory_cls.create(
        **source_values,
        opportunity_id=opportunity_summary.opportunity_id,
        is_deleted=is_delete,
        already_transformed=is_already_processed,
        at_id=legacy_lookup_value,
    )

    if create_existing:
        if opportunity_summary.is_forecast:
            legacy_id = source_applicant_type.at_frcst_id
        else:
            legacy_id = source_applicant_type.at_syn_id

        LinkOpportunitySummaryApplicantTypeFactory.create(
            opportunity_summary=opportunity_summary,
            legacy_applicant_type_id=legacy_id,
            applicant_type=applicant_type
        )

    return source_applicant_type

def validate_matching_fields(
    source, destination, fields: list[Tuple[str, str]], expect_all_to_match: bool
):
    mismatched_fields = []

    for source_field, destination_field in fields:
        source_value = getattr(source, source_field)
        destination_value = getattr(destination, destination_field)
        if source_value != destination_value:
            mismatched_fields.append(
                f"{source_field}/{destination_field}: '{source_value}' != '{destination_value}'"
            )

    # If a values weren't copied in an update
    # then we should expect most things to not match,
    # but randomness in the factories might cause some overlap
    if expect_all_to_match:
        assert (
            len(mismatched_fields) == 0
        ), f"Expected all fields to match between {source.__class__} and {destination.__class__}, but found mismatched fields: {','.join(mismatched_fields)}"
    else:
        assert (
            len(mismatched_fields) != 0
        ), f"Did not expect all fields to match between {source.__class__} and {destination.__class__}, but they did which means an unexpected update occurred"


def validate_opportunity(
    db_session,
    source_opportunity: Topportunity,
    expect_in_db: bool = True,
    expect_values_to_match: bool = True,
):
    opportunity = (
        db_session.query(Opportunity)
        .filter(Opportunity.opportunity_id == source_opportunity.opportunity_id)
        .one_or_none()
    )

    if not expect_in_db:
        assert opportunity is None
        return

    assert opportunity is not None
    # For fields that we expect to match 1:1, verify that they match as expected
    validate_matching_fields(
        source_opportunity,
        opportunity,
        [
            ("oppnumber", "opportunity_number"),
            ("opptitle", "opportunity_title"),
            ("owningagency", "agency"),
            ("category_explanation", "category_explanation"),
            ("revision_number", "revision_number"),
            ("modified_comments", "modified_comments"),
            ("publisheruid", "publisher_user_id"),
            ("publisher_profile_id", "publisher_profile_id"),
        ],
        expect_values_to_match,
    )

    # Validation of fields that aren't copied exactly
    if expect_values_to_match:
        # Deliberately validating is_draft with a different calculation
        if source_opportunity.is_draft == "N":
            assert opportunity.is_draft is False
        else:
            assert opportunity.is_draft is True


def validate_assistance_listing(
    db_session,
    source_cfda: TopportunityCfda,
    expect_in_db: bool = True,
    expect_values_to_match: bool = True,
):
    assistance_listing = (
        db_session.query(OpportunityAssistanceListing)
        .filter(
            OpportunityAssistanceListing.opportunity_assistance_listing_id
            == source_cfda.opp_cfda_id
        )
        .one_or_none()
    )

    if not expect_in_db:
        assert assistance_listing is None
        return

    assert assistance_listing is not None
    # For fields that we expect to match 1:1, verify that they match as expected
    validate_matching_fields(
        source_cfda,
        assistance_listing,
        [
            ("cfdanumber", "assistance_listing_number"),
            ("programtitle", "program_title"),
        ],
        expect_values_to_match,
    )


def validate_opportunity_summary(
    db_session, source_summary, expect_in_db: bool = True, expect_values_to_match: bool = True
):
    revision_number = None
    is_forecast = source_summary.is_forecast
    if isinstance(source_summary, (TsynopsisHist, TforecastHist)):
        revision_number = source_summary.revision_number

    opportunity_summary = (
        db_session.query(OpportunitySummary)
        .filter(
            OpportunitySummary.opportunity_id == source_summary.opportunity_id,
            OpportunitySummary.revision_number == revision_number,
            OpportunitySummary.is_forecast == is_forecast,
        )
        .one_or_none()
    )

    if not expect_in_db:
        assert opportunity_summary is None
        return

    matching_fields = [
        ("version_nbr", "version_number"),
        ("posting_date", "post_date"),
        ("archive_date", "archive_date"),
        ("fd_link_url", "additional_info_url"),
        ("fd_link_desc", "additional_info_url_description"),
        ("modification_comments", "modification_comments"),
        ("oth_cat_fa_desc", "funding_category_description"),
        ("applicant_elig_desc", "applicant_eligibility_description"),
        ("ac_name", "agency_name"),
        ("ac_email_addr", "agency_email_address"),
        ("ac_email_desc", "agency_email_address_description"),
        ("publisher_profile_id", "publisher_profile_id"),
        ("publisheruid", "publisher_user_id"),
        ("last_upd_id", "updated_by"),
        ("creator_id", "created_by"),
    ]

    if isinstance(source_summary, (Tsynopsis, TsynopsisHist)):
        matching_fields.extend(
            [
                ("syn_desc", "summary_description"),
                ("a_sa_code", "agency_code"),
                ("ac_phone_number", "agency_phone_number"),
                ("agency_contact_desc", "agency_contact_description"),
                ("response_date", "close_date"),
                ("response_date_desc", "close_date_description"),
                ("unarchive_date", "unarchive_date"),
            ]
        )
    else:  # Forecast+ForecastHist
        matching_fields.extend(
            [
                ("forecast_desc", "summary_description"),
                ("agency_code", "agency_code"),
                ("ac_phone", "agency_phone_number"),
                ("est_synopsis_posting_date", "forecasted_post_date"),
                ("est_appl_response_date", "forecasted_close_date"),
                ("est_appl_response_date_desc", "forecasted_close_date_description"),
                ("est_award_date", "forecasted_award_date"),
                ("est_project_start_date", "forecasted_project_start_date"),
                ("fiscal_year", "fiscal_year"),
            ]
        )

    # History only fields
    is_deleted = False
    if isinstance(source_summary, (TsynopsisHist, TforecastHist)):
        matching_fields.extend([("revision_number", "revision_number")])

        is_deleted = source_summary.action_type == "D"

    assert opportunity_summary is not None
    validate_matching_fields(
        source_summary, opportunity_summary, matching_fields, expect_values_to_match
    )

    assert opportunity_summary.is_deleted == is_deleted

def validate_applicant_type(db_session, source_applicant_type, expect_in_db: bool = True, expected_applicant_type: ApplicantType | None = None):
    if isinstance(source_applicant_type, (TapplicanttypesSynopsis, TapplicanttypesSynopsisHist)):
        is_forecast = False
        legacy_id = source_applicant_type.at_syn_id
    else:
        is_forecast = True
        legacy_id = source_applicant_type.at_frcst_id

    revision_number = None
    if isinstance(source_applicant_type, (TapplicanttypesSynopsisHist, TapplicanttypesForecastHist)):
        revision_number = source_applicant_type.revision_number

    # In order to properly find the link table value, need to first determine
    # the opportunity summary in a subquery
    opportunity_summary_id = db_session.query(OpportunitySummary.opportunity_summary_id).filter(
        OpportunitySummary.revision_number == revision_number, OpportunitySummary.is_forecast == is_forecast, OpportunitySummary.opportunity_id == source_applicant_type.opportunity_id
    ).scalar()

    link_applicant_type = (
        db_session.query(LinkOpportunitySummaryApplicantType)
        .filter(
            LinkOpportunitySummaryApplicantType.legacy_applicant_type_id == legacy_id,
            LinkOpportunitySummaryApplicantType.opportunity_summary_id == opportunity_summary_id
        )
        .one_or_none()
    )

    if not expect_in_db:
        assert link_applicant_type is None
        return

    assert link_applicant_type is not None
    assert link_applicant_type.applicant_type == expected_applicant_type


class TestTransformOpportunity(BaseTestClass):
    @pytest.fixture()
    def transform_oracle_data_task(
        self, db_session, enable_factory_create, truncate_opportunities
    ) -> TransformOracleDataTask:
        return TransformOracleDataTask(db_session)

    def test_process_opportunities(self, db_session, transform_oracle_data_task):
        ordinary_delete = setup_opportunity(
            create_existing=True, is_delete=True, all_fields_null=True
        )
        ordinary_delete2 = setup_opportunity(
            create_existing=True, is_delete=True, all_fields_null=False
        )
        delete_but_current_missing = setup_opportunity(create_existing=False, is_delete=True)

        basic_insert = setup_opportunity(create_existing=False)
        basic_insert2 = setup_opportunity(create_existing=False, all_fields_null=True)
        basic_insert3 = setup_opportunity(create_existing=False)

        basic_update = setup_opportunity(
            create_existing=True,
        )
        basic_update2 = setup_opportunity(create_existing=True, all_fields_null=True)
        basic_update3 = setup_opportunity(create_existing=True, all_fields_null=True)
        basic_update4 = setup_opportunity(create_existing=True)

        # Something else deleted it
        already_processed_insert = setup_opportunity(
            create_existing=False, is_already_processed=True
        )
        already_processed_update = setup_opportunity(
            create_existing=True, is_already_processed=True
        )

        insert_that_will_fail = setup_opportunity(
            create_existing=False, source_values={"oppcategory": "X"}
        )

        transform_oracle_data_task.process_opportunities()

        validate_opportunity(db_session, ordinary_delete, expect_in_db=False)
        validate_opportunity(db_session, ordinary_delete2, expect_in_db=False)
        validate_opportunity(db_session, delete_but_current_missing, expect_in_db=False)

        validate_opportunity(db_session, basic_insert)
        validate_opportunity(db_session, basic_insert2)
        validate_opportunity(db_session, basic_insert3)

        validate_opportunity(db_session, basic_update)
        validate_opportunity(db_session, basic_update2)
        validate_opportunity(db_session, basic_update3)
        validate_opportunity(db_session, basic_update4)

        validate_opportunity(db_session, already_processed_insert, expect_in_db=False)
        validate_opportunity(db_session, already_processed_update, expect_values_to_match=False)

        validate_opportunity(db_session, insert_that_will_fail, expect_in_db=False)

        metrics = transform_oracle_data_task.metrics
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_PROCESSED] == 11
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_DELETED] == 2
        # Note this insert counts the case where the category fails
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_INSERTED] == 3
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_UPDATED] == 4
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_ERROR_COUNT] == 2

        # Rerunning does mostly nothing, it will attempt to re-process the two that errored
        # but otherwise won't find anything else
        transform_oracle_data_task.process_opportunities()
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_PROCESSED] == 13
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_DELETED] == 2
        # Note this insert counts the case where the category fails
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_INSERTED] == 3
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_UPDATED] == 4
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_ERROR_COUNT] == 4

    def test_process_opportunity_delete_but_current_missing(
        self, db_session, transform_oracle_data_task
    ):
        # Verify an error is raised when we try to delete something that doesn't exist
        delete_but_current_missing = setup_opportunity(create_existing=False, is_delete=True)

        with pytest.raises(ValueError, match="Cannot delete opportunity as it does not exist"):
            transform_oracle_data_task.process_opportunity(delete_but_current_missing, None)

        validate_opportunity(db_session, delete_but_current_missing, expect_in_db=False)

    def test_process_opportunity_invalid_category(self, db_session, transform_oracle_data_task):
        # This will error in the transform as that isn't a category we have configured
        insert_that_will_fail = setup_opportunity(
            create_existing=False, source_values={"oppcategory": "X"}
        )

        with pytest.raises(ValueError, match="Unrecognized opportunity category"):
            transform_oracle_data_task.process_opportunity(insert_that_will_fail, None)

        validate_opportunity(db_session, insert_that_will_fail, expect_in_db=False)


class TestTransformAssistanceListing(BaseTestClass):
    @pytest.fixture()
    def transform_oracle_data_task(
        self, db_session, enable_factory_create, truncate_opportunities
    ) -> TransformOracleDataTask:
        return TransformOracleDataTask(db_session)

    def test_process_opportunity_assistance_listings(self, db_session, transform_oracle_data_task):
        opportunity1 = OpportunityFactory.create(opportunity_assistance_listings=[])
        cfda_insert1 = setup_cfda(create_existing=False, opportunity=opportunity1)
        cfda_insert2 = setup_cfda(create_existing=False, opportunity=opportunity1)
        cfda_update1 = setup_cfda(create_existing=True, opportunity=opportunity1)
        cfda_delete1 = setup_cfda(create_existing=True, is_delete=True, opportunity=opportunity1)
        cfda_update_already_processed1 = setup_cfda(
            create_existing=True, is_already_processed=True, opportunity=opportunity1
        )

        opportunity2 = OpportunityFactory.create(opportunity_assistance_listings=[])
        cfda_insert3 = setup_cfda(create_existing=False, opportunity=opportunity2)
        cfda_update_already_processed2 = setup_cfda(
            create_existing=True, is_already_processed=True, opportunity=opportunity2
        )
        cfda_delete_already_processed1 = setup_cfda(
            create_existing=False,
            is_already_processed=True,
            is_delete=True,
            opportunity=opportunity2,
        )
        cfda_delete2 = setup_cfda(create_existing=True, is_delete=True, opportunity=opportunity2)

        opportunity3 = OpportunityFactory.create(opportunity_assistance_listings=[])
        cfda_update2 = setup_cfda(create_existing=True, opportunity=opportunity3)
        cfda_delete_but_current_missing = setup_cfda(
            create_existing=False, is_delete=True, opportunity=opportunity3
        )

        cfda_insert_without_opportunity = setup_cfda(
            create_existing=False, source_values={"opportunity_id": 12345678}, opportunity=None
        )
        cfda_delete_without_opportunity = setup_cfda(
            create_existing=False, source_values={"opportunity_id": 34567890}, opportunity=None
        )

        transform_oracle_data_task.process_assistance_listings()

        validate_assistance_listing(db_session, cfda_insert1)
        validate_assistance_listing(db_session, cfda_insert2)
        validate_assistance_listing(db_session, cfda_insert3)
        validate_assistance_listing(db_session, cfda_update1)
        validate_assistance_listing(db_session, cfda_update2)
        validate_assistance_listing(db_session, cfda_delete1, expect_in_db=False)
        validate_assistance_listing(db_session, cfda_delete2, expect_in_db=False)

        # Records that won't have been fetched
        validate_assistance_listing(
            db_session,
            cfda_update_already_processed1,
            expect_in_db=True,
            expect_values_to_match=False,
        )
        validate_assistance_listing(
            db_session,
            cfda_update_already_processed2,
            expect_in_db=True,
            expect_values_to_match=False,
        )
        validate_assistance_listing(db_session, cfda_delete_already_processed1, expect_in_db=False)

        validate_assistance_listing(db_session, cfda_delete_but_current_missing, expect_in_db=False)

        validate_assistance_listing(db_session, cfda_insert_without_opportunity, expect_in_db=False)
        validate_assistance_listing(db_session, cfda_delete_without_opportunity, expect_in_db=False)

        metrics = transform_oracle_data_task.metrics
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_PROCESSED] == 10
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_DELETED] == 2
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_INSERTED] == 3
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_UPDATED] == 2
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_ORPHANED] == 2
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_ERROR_COUNT] == 1

        # Rerunning just attempts to re-process the error record, nothing else gets picked up
        transform_oracle_data_task.process_assistance_listings()
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_PROCESSED] == 11
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_DELETED] == 2
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_INSERTED] == 3
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_UPDATED] == 2
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_ORPHANED] == 2
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_ERROR_COUNT] == 2

    def test_process_assistance_listing_orphaned_record(
        self, db_session, transform_oracle_data_task
    ):
        cfda_insert_without_opportunity = setup_cfda(
            create_existing=False, source_values={"opportunity_id": 987654321}, opportunity=None
        )

        # Verify it gets marked as transformed
        assert cfda_insert_without_opportunity.transformed_at is None
        transform_oracle_data_task.process_assistance_listing(
            cfda_insert_without_opportunity, None, None
        )
        assert cfda_insert_without_opportunity.transformed_at is not None
        assert (
            transform_oracle_data_task.metrics[
                transform_oracle_data_task.Metrics.TOTAL_RECORDS_ORPHANED
            ]
            == 1
        )

        # Verify nothing actually gets created
        opportunity = (
            db_session.query(Opportunity)
            .filter(Opportunity.opportunity_id == cfda_insert_without_opportunity.opportunity_id)
            .one_or_none()
        )
        assert opportunity is None
        assistance_listing = (
            db_session.query(OpportunityAssistanceListing)
            .filter(
                OpportunityAssistanceListing.opportunity_assistance_listing_id
                == cfda_insert_without_opportunity.opp_cfda_id
            )
            .one_or_none()
        )
        assert assistance_listing is None

    def test_process_assistance_listing_delete_but_current_missing(
        self, db_session, transform_oracle_data_task
    ):
        opportunity = OpportunityFactory.create(opportunity_assistance_listings=[])
        delete_but_current_missing = setup_cfda(
            create_existing=False, is_delete=True, opportunity=opportunity
        )

        with pytest.raises(
            ValueError, match="Cannot delete assistance listing as it does not exist"
        ):
            transform_oracle_data_task.process_assistance_listing(
                delete_but_current_missing, None, opportunity
            )

        validate_assistance_listing(db_session, delete_but_current_missing, expect_in_db=False)


class TestTransformOpportunitySummary(BaseTestClass):
    @pytest.fixture()
    def transform_oracle_data_task(
        self, db_session, enable_factory_create, truncate_opportunities
    ) -> TransformOracleDataTask:
        return TransformOracleDataTask(db_session)

    def test_process_opportunity_summaries(self, db_session, transform_oracle_data_task):
        # Basic inserts
        opportunity1 = OpportunityFactory.create(
            no_current_summary=True, opportunity_assistance_listings=[]
        )
        forecast_insert1 = setup_synopsis_forecast(
            is_forecast=True, revision_number=None, create_existing=False, opportunity=opportunity1
        )
        synopsis_insert1 = setup_synopsis_forecast(
            is_forecast=False, revision_number=None, create_existing=False, opportunity=opportunity1
        )
        forecast_hist_insert1 = setup_synopsis_forecast(
            is_forecast=True, revision_number=1, create_existing=False, opportunity=opportunity1
        )
        synopsis_hist_insert1 = setup_synopsis_forecast(
            is_forecast=False, revision_number=1, create_existing=False, opportunity=opportunity1
        )

        # Mix of updates and inserts, somewhat resembling what happens when summary objects
        # get moved to the historical table (we'd update the synopsis/forecast records, and create new historical)
        opportunity2 = OpportunityFactory.create(
            no_current_summary=True, opportunity_assistance_listings=[]
        )
        forecast_update1 = setup_synopsis_forecast(
            is_forecast=True, revision_number=None, create_existing=True, opportunity=opportunity2
        )
        synopsis_update1 = setup_synopsis_forecast(
            is_forecast=False, revision_number=None, create_existing=True, opportunity=opportunity2
        )
        forecast_hist_update1 = setup_synopsis_forecast(
            is_forecast=True, revision_number=1, create_existing=True, opportunity=opportunity2
        )
        synopsis_hist_update1 = setup_synopsis_forecast(
            is_forecast=False, revision_number=1, create_existing=True, opportunity=opportunity2
        )
        forecast_hist_insert2 = setup_synopsis_forecast(
            is_forecast=True, revision_number=2, create_existing=False, opportunity=opportunity2
        )
        synopsis_hist_insert2 = setup_synopsis_forecast(
            is_forecast=False, revision_number=2, create_existing=False, opportunity=opportunity2
        )

        # Mix of inserts, updates, and deletes
        opportunity3 = OpportunityFactory.create(
            no_current_summary=True, opportunity_assistance_listings=[]
        )
        forecast_delete1 = setup_synopsis_forecast(
            is_forecast=True,
            revision_number=None,
            create_existing=True,
            is_delete=True,
            opportunity=opportunity3,
        )
        synopsis_delete1 = setup_synopsis_forecast(
            is_forecast=False,
            revision_number=None,
            create_existing=True,
            is_delete=True,
            opportunity=opportunity3,
        )
        forecast_hist_insert3 = setup_synopsis_forecast(
            is_forecast=True, revision_number=2, create_existing=False, opportunity=opportunity3
        )
        synopsis_hist_update2 = setup_synopsis_forecast(
            is_forecast=False,
            revision_number=1,
            create_existing=True,
            source_values={"action_type": "D"},
            opportunity=opportunity3,
        )

        # A few error scenarios
        opportunity4 = OpportunityFactory.create(
            no_current_summary=True, opportunity_assistance_listings=[]
        )
        forecast_delete_but_current_missing = setup_synopsis_forecast(
            is_forecast=True,
            revision_number=None,
            create_existing=False,
            is_delete=True,
            opportunity=opportunity4,
        )
        synopsis_update_invalid_yn_field = setup_synopsis_forecast(
            is_forecast=False,
            revision_number=None,
            create_existing=True,
            source_values={"sendmail": "E"},
            opportunity=opportunity4,
        )
        synopsis_hist_insert_invalid_yn_field = setup_synopsis_forecast(
            is_forecast=False,
            revision_number=1,
            create_existing=False,
            source_values={"cost_sharing": "1"},
            opportunity=opportunity4,
        )
        forecast_hist_update_invalid_action_type = setup_synopsis_forecast(
            is_forecast=True,
            revision_number=2,
            create_existing=True,
            source_values={"action_type": "X"},
            opportunity=opportunity4,
        )

        transform_oracle_data_task.process_opportunity_summaries()

        validate_opportunity_summary(db_session, forecast_insert1)
        validate_opportunity_summary(db_session, synopsis_insert1)
        validate_opportunity_summary(db_session, forecast_hist_insert1)
        validate_opportunity_summary(db_session, synopsis_hist_insert1)
        validate_opportunity_summary(db_session, forecast_hist_insert2)
        validate_opportunity_summary(db_session, synopsis_hist_insert2)
        validate_opportunity_summary(db_session, forecast_hist_insert3)

        validate_opportunity_summary(db_session, forecast_update1)
        validate_opportunity_summary(db_session, synopsis_update1)
        validate_opportunity_summary(db_session, forecast_hist_update1)
        validate_opportunity_summary(db_session, synopsis_hist_update1)
        validate_opportunity_summary(db_session, synopsis_hist_update2)

        validate_opportunity_summary(db_session, forecast_delete1, expect_in_db=False)
        validate_opportunity_summary(db_session, synopsis_delete1, expect_in_db=False)

        validate_opportunity_summary(
            db_session, forecast_delete_but_current_missing, expect_in_db=False
        )
        validate_opportunity_summary(
            db_session,
            synopsis_update_invalid_yn_field,
            expect_in_db=True,
            expect_values_to_match=False,
        )
        validate_opportunity_summary(
            db_session, synopsis_hist_insert_invalid_yn_field, expect_in_db=False
        )
        validate_opportunity_summary(
            db_session,
            forecast_hist_update_invalid_action_type,
            expect_in_db=True,
            expect_values_to_match=False,
        )

        metrics = transform_oracle_data_task.metrics
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_PROCESSED] == 18
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_DELETED] == 2
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_INSERTED] == 7
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_UPDATED] == 5
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_ERROR_COUNT] == 4

        # Rerunning will only attempt to re-process the errors, so total+errors goes up by 4
        transform_oracle_data_task.process_opportunity_summaries()
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_PROCESSED] == 22
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_DELETED] == 2
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_INSERTED] == 7
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_UPDATED] == 5
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_ERROR_COUNT] == 8

    @pytest.mark.parametrize(
        "is_forecast,revision_number", [(True, None), (False, None), (True, 5), (False, 10)]
    )
    def test_process_opportunity_summary_delete_but_current_missing(
        self, db_session, transform_oracle_data_task, is_forecast, revision_number
    ):
        opportunity = OpportunityFactory.create(
            no_current_summary=True, opportunity_assistance_listings=[]
        )
        delete_but_current_missing = setup_synopsis_forecast(
            is_forecast=is_forecast,
            revision_number=revision_number,
            create_existing=False,
            is_delete=True,
            opportunity=opportunity,
        )

        with pytest.raises(
            ValueError, match="Cannot delete opportunity summary as it does not exist"
        ):
            transform_oracle_data_task.process_opportunity_summary(
                delete_but_current_missing, None, opportunity
            )

    @pytest.mark.parametrize(
        "is_forecast,revision_number,source_values,expected_error",
        [
            (True, None, {"sendmail": "z"}, "Unexpected Y/N bool value: z"),
            (False, None, {"cost_sharing": "v"}, "Unexpected Y/N bool value: v"),
            (True, 5, {"action_type": "T"}, "Unexpected action type value: T"),
            (False, 10, {"action_type": "5"}, "Unexpected action type value: 5"),
        ],
    )
    def test_process_opportunity_summary_invalid_value_errors(
        self,
        db_session,
        transform_oracle_data_task,
        is_forecast,
        revision_number,
        source_values,
        expected_error,
    ):
        opportunity = OpportunityFactory.create(
            no_current_summary=True, opportunity_assistance_listings=[]
        )
        source_summary = setup_synopsis_forecast(
            is_forecast=is_forecast,
            revision_number=revision_number,
            create_existing=False,
            opportunity=opportunity,
            source_values=source_values,
        )

        with pytest.raises(ValueError, match=expected_error):
            transform_oracle_data_task.process_opportunity_summary(
                source_summary, None, opportunity
            )


class TestTransformApplicantType(BaseTestClass):
    @pytest.fixture()
    def transform_oracle_data_task(
        self, db_session, enable_factory_create, truncate_opportunities
    ) -> TransformOracleDataTask:
        return TransformOracleDataTask(db_session)

    def test_process_applicant_types(self, db_session, transform_oracle_data_task):
        opportunity_summary_forecast = OpportunitySummaryFactory.create(is_forecast=True, revision_number=None, no_link_values=True)
        forecast_insert1 = setup_applicant_type(create_existing=False, opportunity_summary=opportunity_summary_forecast, legacy_lookup_value="00")
        forecast_update1 = setup_applicant_type(create_existing=True, opportunity_summary=opportunity_summary_forecast, legacy_lookup_value="01", applicant_type=ApplicantType.COUNTY_GOVERNMENTS)
        forecast_update2 = setup_applicant_type(create_existing=True, opportunity_summary=opportunity_summary_forecast, legacy_lookup_value="02", applicant_type=ApplicantType.CITY_OR_TOWNSHIP_GOVERNMENTS)
        forecast_delete1 = setup_applicant_type(create_existing=True, is_delete=True, opportunity_summary=opportunity_summary_forecast, legacy_lookup_value="04", applicant_type=ApplicantType.SPECIAL_DISTRICT_GOVERNMENTS)
        forecast_delete2 = setup_applicant_type(create_existing=True, is_delete=True, opportunity_summary=opportunity_summary_forecast, legacy_lookup_value="05", applicant_type=ApplicantType.INDEPENDENT_SCHOOL_DISTRICTS)
        forecast_update_already_processed = setup_applicant_type(create_existing=True, is_already_processed=True, opportunity_summary=opportunity_summary_forecast, legacy_lookup_value="06", applicant_type=ApplicantType.PUBLIC_AND_STATE_INSTITUTIONS_OF_HIGHER_EDUCATION)


        opportunity_summary_forecast_hist = OpportunitySummaryFactory.create(is_forecast=True, revision_number=3, no_link_values=True)
        forecast_hist_insert1 = setup_applicant_type(create_existing=False, opportunity_summary=opportunity_summary_forecast_hist, legacy_lookup_value="07")
        forecast_hist_update1 = setup_applicant_type(create_existing=True, opportunity_summary=opportunity_summary_forecast_hist, legacy_lookup_value="08", applicant_type=ApplicantType.PUBLIC_AND_INDIAN_HOUSING_AUTHORITIES)
        forecast_hist_update2 = setup_applicant_type(create_existing=True, opportunity_summary=opportunity_summary_forecast_hist, legacy_lookup_value="11", applicant_type=ApplicantType.OTHER_NATIVE_AMERICAN_TRIBAL_ORGANIZATIONS)
        forecast_hist_delete1 = setup_applicant_type(create_existing=True, is_delete=True, opportunity_summary=opportunity_summary_forecast_hist, legacy_lookup_value="12", applicant_type=ApplicantType.NONPROFITS_NON_HIGHER_EDUCATION_WITH_501C3)
        forecast_hist_already_processed = setup_applicant_type(create_existing=False, is_delete=True, is_already_processed=True, opportunity_summary=opportunity_summary_forecast_hist, legacy_lookup_value="13", applicant_type=ApplicantType.NONPROFITS_NON_HIGHER_EDUCATION_WITHOUT_501C3)

        opportunity_summary_syn = OpportunitySummaryFactory.create(is_forecast=False, revision_number=None, no_link_values=True)
        syn_insert1 = setup_applicant_type(create_existing=False, opportunity_summary=opportunity_summary_syn, legacy_lookup_value="20")
        syn_insert2 = setup_applicant_type(create_existing=False, opportunity_summary=opportunity_summary_syn, legacy_lookup_value="21")
        syn_update1 = setup_applicant_type(create_existing=True, opportunity_summary=opportunity_summary_syn, legacy_lookup_value="22", applicant_type=ApplicantType.FOR_PROFIT_ORGANIZATIONS_OTHER_THAN_SMALL_BUSINESSES)
        syn_update2 = setup_applicant_type(create_existing=True, opportunity_summary=opportunity_summary_syn, legacy_lookup_value="23", applicant_type=ApplicantType.SMALL_BUSINESSES)
        syn_delete1 = setup_applicant_type(create_existing=True, is_delete=True, opportunity_summary=opportunity_summary_syn, legacy_lookup_value="25", applicant_type=ApplicantType.OTHER)
        syn_delete2 = setup_applicant_type(create_existing=True, is_delete=True, opportunity_summary=opportunity_summary_syn, legacy_lookup_value="99", applicant_type=ApplicantType.UNRESTRICTED)
        syn_delete_but_current_missing = setup_applicant_type(create_existing=False, is_delete=True, opportunity_summary=opportunity_summary_syn, legacy_lookup_value="07", applicant_type=ApplicantType.FEDERALLY_RECOGNIZED_NATIVE_AMERICAN_TRIBAL_GOVERNMENTS)
        syn_update_already_processed = setup_applicant_type(create_existing=True, is_already_processed=True, opportunity_summary=opportunity_summary_syn, legacy_lookup_value="08", applicant_type=ApplicantType.PUBLIC_AND_INDIAN_HOUSING_AUTHORITIES)

        opportunity_summary_syn_hist = OpportunitySummaryFactory.create(is_forecast=False, revision_number=21, no_link_values=True)
        syn_hist_insert1 = setup_applicant_type(create_existing=False, opportunity_summary=opportunity_summary_syn_hist, legacy_lookup_value="11")
        syn_hist_update1 = setup_applicant_type(create_existing=True, opportunity_summary=opportunity_summary_syn_hist, legacy_lookup_value="12", applicant_type=ApplicantType.NONPROFITS_NON_HIGHER_EDUCATION_WITH_501C3)
        syn_hist_update2 = setup_applicant_type(create_existing=True, opportunity_summary=opportunity_summary_syn_hist, legacy_lookup_value="13", applicant_type=ApplicantType.NONPROFITS_NON_HIGHER_EDUCATION_WITHOUT_501C3)
        syn_hist_delete1 = setup_applicant_type(create_existing=True, is_delete=True, opportunity_summary=opportunity_summary_syn_hist, legacy_lookup_value="25", applicant_type=ApplicantType.OTHER)
        syn_hist_delete2 = setup_applicant_type(create_existing=True, is_delete=True, opportunity_summary=opportunity_summary_syn_hist, legacy_lookup_value="99", applicant_type=ApplicantType.UNRESTRICTED)
        # TODO - note this one
        syn_hist_insert_invalid_type = setup_applicant_type(create_existing=False, opportunity_summary=opportunity_summary_syn_hist, legacy_lookup_value="X", applicant_type=ApplicantType.STATE_GOVERNMENTS)

        transform_oracle_data_task.process_link_applicant_types()
        print(transform_oracle_data_task.metrics)

        validate_applicant_type(db_session, forecast_insert1, expected_applicant_type=ApplicantType.STATE_GOVERNMENTS)
        validate_applicant_type(db_session, forecast_hist_insert1, expected_applicant_type=ApplicantType.FEDERALLY_RECOGNIZED_NATIVE_AMERICAN_TRIBAL_GOVERNMENTS)
        validate_applicant_type(db_session, syn_insert1, expected_applicant_type=ApplicantType.PRIVATE_INSTITUTIONS_OF_HIGHER_EDUCATION)
        validate_applicant_type(db_session, syn_insert2, expected_applicant_type=ApplicantType.INDIVIDUALS)
        validate_applicant_type(db_session, syn_hist_insert1, expected_applicant_type=ApplicantType.OTHER_NATIVE_AMERICAN_TRIBAL_ORGANIZATIONS)

        validate_applicant_type(db_session, forecast_update1, expected_applicant_type=ApplicantType.COUNTY_GOVERNMENTS)
        validate_applicant_type(db_session, forecast_update2, expected_applicant_type=ApplicantType.CITY_OR_TOWNSHIP_GOVERNMENTS)

