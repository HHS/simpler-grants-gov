from typing import Tuple

import pytest

import tests.src.db.models.factories as f
from src.constants.lookup_constants import ApplicantType, FundingCategory, FundingInstrument
from src.data_migration.transformation.transform_oracle_data_task import TransformOracleDataTask
from src.db.models import staging
from src.db.models.opportunity_models import (
    LinkOpportunitySummaryApplicantType,
    LinkOpportunitySummaryFundingCategory,
    LinkOpportunitySummaryFundingInstrument,
    Opportunity,
    OpportunityAssistanceListing,
    OpportunitySummary,
)
from tests.conftest import BaseTestClass


def setup_opportunity(
    create_existing: bool,
    is_delete: bool = False,
    is_already_processed: bool = False,
    source_values: dict | None = None,
    all_fields_null: bool = False,
) -> staging.opportunity.Topportunity:
    if source_values is None:
        source_values = {}

    source_opportunity = f.StagingTopportunityFactory.create(
        **source_values,
        is_deleted=is_delete,
        already_transformed=is_already_processed,
        all_fields_null=all_fields_null,
        cfdas=[],
    )

    if create_existing:
        f.OpportunityFactory.create(
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
) -> staging.opportunity.TopportunityCfda:
    if source_values is None:
        source_values = {}

    # If you don't provide an opportunity, you need to provide an ID
    if opportunity is not None:
        source_values["opportunity_id"] = opportunity.opportunity_id

    source_cfda = f.StagingTopportunityCfdaFactory.create(
        **source_values,
        opportunity=None,  # To override the factory trying to create something
        is_deleted=is_delete,
        already_transformed=is_already_processed,
        all_fields_null=all_fields_null,
    )

    if create_existing:
        f.OpportunityAssistanceListingFactory.create(
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
            factory_cls = f.StagingTforecastFactory
        else:
            factory_cls = f.StagingTforecastHistFactory
    else:
        if revision_number is None:
            factory_cls = f.StagingTsynopsisFactory
        else:
            factory_cls = f.StagingTsynopsisHistFactory

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
        f.OpportunitySummaryFactory.create(
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
        raise Exception(
            "If create_existing is True, is_delete is False - must provide the properly converted / mapped value for applicant_type"
        )

    if source_values is None:
        source_values = {}

    if opportunity_summary.is_forecast:
        source_values["forecast"] = None
        if opportunity_summary.revision_number is None:
            factory_cls = f.StagingTapplicanttypesForecastFactory
        else:
            factory_cls = f.StagingTapplicanttypesForecastHistFactory
            source_values["revision_number"] = opportunity_summary.revision_number
    else:
        source_values["synopsis"] = None
        if opportunity_summary.revision_number is None:
            factory_cls = f.StagingTapplicanttypesSynopsisFactory
        else:
            factory_cls = f.StagingTapplicanttypesSynopsisHistFactory
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

        f.LinkOpportunitySummaryApplicantTypeFactory.create(
            opportunity_summary=opportunity_summary,
            legacy_applicant_type_id=legacy_id,
            applicant_type=applicant_type,
        )

    return source_applicant_type


def setup_funding_instrument(
    create_existing: bool,
    opportunity_summary: OpportunitySummary,
    legacy_lookup_value: str,
    funding_instrument: FundingInstrument | None = None,
    is_delete: bool = False,
    is_already_processed: bool = False,
    source_values: dict | None = None,
):
    if create_existing and is_delete is False and funding_instrument is None:
        raise Exception(
            "If create_existing is True, is_delete is False - must provide the properly converted / mapped value for funding_instrument"
        )

    if source_values is None:
        source_values = {}

    if opportunity_summary.is_forecast:
        source_values["forecast"] = None
        if opportunity_summary.revision_number is None:
            factory_cls = f.StagingTfundinstrForecastFactory
        else:
            factory_cls = f.StagingTfundinstrForecastHistFactory
            source_values["revision_number"] = opportunity_summary.revision_number
    else:
        source_values["synopsis"] = None
        if opportunity_summary.revision_number is None:
            factory_cls = f.StagingTfundinstrSynopsisFactory
        else:
            factory_cls = f.StagingTfundinstrSynopsisHistFactory
            source_values["revision_number"] = opportunity_summary.revision_number

    source_funding_instrument = factory_cls.create(
        **source_values,
        opportunity_id=opportunity_summary.opportunity_id,
        is_deleted=is_delete,
        already_transformed=is_already_processed,
        fi_id=legacy_lookup_value,
    )

    if create_existing:
        if opportunity_summary.is_forecast:
            legacy_id = source_funding_instrument.fi_frcst_id
        else:
            legacy_id = source_funding_instrument.fi_syn_id

        f.LinkOpportunitySummaryFundingInstrumentFactory.create(
            opportunity_summary=opportunity_summary,
            legacy_funding_instrument_id=legacy_id,
            funding_instrument=funding_instrument,
        )

    return source_funding_instrument


def setup_funding_category(
    create_existing: bool,
    opportunity_summary: OpportunitySummary,
    legacy_lookup_value: str,
    funding_category: FundingCategory | None = None,
    is_delete: bool = False,
    is_already_processed: bool = False,
    source_values: dict | None = None,
):
    if create_existing and is_delete is False and funding_category is None:
        raise Exception(
            "If create_existing is True, is_delete is False - must provide the properly converted / mapped value for funding_category"
        )

    if source_values is None:
        source_values = {}

    if opportunity_summary.is_forecast:
        source_values["forecast"] = None
        if opportunity_summary.revision_number is None:
            factory_cls = f.StagingTfundactcatForecastFactory
        else:
            factory_cls = f.StagingTfundactcatForecastHistFactory
            source_values["revision_number"] = opportunity_summary.revision_number
    else:
        source_values["synopsis"] = None
        if opportunity_summary.revision_number is None:
            factory_cls = f.StagingTfundactcatSynopsisFactory
        else:
            factory_cls = f.StagingTfundactcatSynopsisHistFactory
            source_values["revision_number"] = opportunity_summary.revision_number

    source_funding_category = factory_cls.create(
        **source_values,
        opportunity_id=opportunity_summary.opportunity_id,
        is_deleted=is_delete,
        already_transformed=is_already_processed,
        fac_id=legacy_lookup_value,
    )

    if create_existing:
        if opportunity_summary.is_forecast:
            legacy_id = source_funding_category.fac_frcst_id
        else:
            legacy_id = source_funding_category.fac_syn_id

        f.LinkOpportunitySummaryFundingCategoryFactory.create(
            opportunity_summary=opportunity_summary,
            legacy_funding_category_id=legacy_id,
            funding_category=funding_category,
        )

    return source_funding_category


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
    source_opportunity: staging.opportunity.Topportunity,
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
    source_cfda: staging.opportunity.TopportunityCfda,
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


def get_summary_from_source(db_session, source_summary):
    revision_number = None
    is_forecast = source_summary.is_forecast
    if isinstance(source_summary, (staging.synopsis.TsynopsisHist, staging.forecast.TforecastHist)):
        revision_number = source_summary.revision_number

    opportunity_summary = (
        db_session.query(OpportunitySummary)
        .filter(
            OpportunitySummary.opportunity_id == source_summary.opportunity_id,
            OpportunitySummary.revision_number == revision_number,
            OpportunitySummary.is_forecast == is_forecast,
            # Populate existing to force it to fetch updates from the DB
        )
        .execution_options(populate_existing=True)
        .one_or_none()
    )

    return opportunity_summary


def validate_opportunity_summary(
    db_session, source_summary, expect_in_db: bool = True, expect_values_to_match: bool = True
):
    opportunity_summary = get_summary_from_source(db_session, source_summary)

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

    if isinstance(source_summary, (staging.synopsis.Tsynopsis, staging.synopsis.TsynopsisHist)):
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
    if isinstance(source_summary, (staging.synopsis.TsynopsisHist, staging.forecast.TforecastHist)):
        matching_fields.extend([("revision_number", "revision_number")])

        is_deleted = source_summary.action_type == "D"

    assert opportunity_summary is not None
    validate_matching_fields(
        source_summary, opportunity_summary, matching_fields, expect_values_to_match
    )

    assert opportunity_summary.is_deleted == is_deleted


def validate_summary_and_nested(
    db_session,
    source_summary,
    expected_applicant_types: list[ApplicantType],
    expected_funding_categories: list[FundingCategory],
    expected_funding_instruments: list[FundingInstrument],
    expect_in_db: bool = True,
    expect_values_to_match: bool = True,
):
    validate_opportunity_summary(db_session, source_summary, expect_in_db, expect_values_to_match)

    if not expect_in_db:
        return

    created_record = get_summary_from_source(db_session, source_summary)

    assert set(created_record.applicant_types) == set(expected_applicant_types)
    assert set(created_record.funding_categories) == set(expected_funding_categories)
    assert set(created_record.funding_instruments) == set(expected_funding_instruments)


def validate_applicant_type(
    db_session,
    source_applicant_type,
    expect_in_db: bool = True,
    expected_applicant_type: ApplicantType | None = None,
    was_processed: bool = True,
    expect_values_to_match: bool = True,
):
    assert (source_applicant_type.transformed_at is not None) == was_processed

    # In order to properly find the link table value, need to first determine
    # the opportunity summary in a subquery
    opportunity_summary_id = (
        db_session.query(OpportunitySummary.opportunity_summary_id)
        .filter(
            OpportunitySummary.revision_number == source_applicant_type.revision_number,
            OpportunitySummary.is_forecast == source_applicant_type.is_forecast,
            OpportunitySummary.opportunity_id == source_applicant_type.opportunity_id,
        )
        .scalar()
    )

    link_applicant_type = (
        db_session.query(LinkOpportunitySummaryApplicantType)
        .filter(
            LinkOpportunitySummaryApplicantType.legacy_applicant_type_id
            == source_applicant_type.legacy_applicant_type_id,
            LinkOpportunitySummaryApplicantType.opportunity_summary_id == opportunity_summary_id,
        )
        .one_or_none()
    )

    if not expect_in_db:
        assert link_applicant_type is None
        return

    assert link_applicant_type is not None
    assert link_applicant_type.applicant_type == expected_applicant_type

    validate_matching_fields(
        source_applicant_type,
        link_applicant_type,
        [("creator_id", "created_by"), ("last_upd_id", "updated_by")],
        expect_values_to_match,
    )


def validate_funding_instrument(
    db_session,
    source_funding_instrument,
    expect_in_db: bool = True,
    expected_funding_instrument: FundingInstrument | None = None,
    was_processed: bool = True,
    expect_values_to_match: bool = True,
):
    assert (source_funding_instrument.transformed_at is not None) == was_processed

    # In order to properly find the link table value, need to first determine
    # the opportunity summary in a subquery
    opportunity_summary_id = (
        db_session.query(OpportunitySummary.opportunity_summary_id)
        .filter(
            OpportunitySummary.revision_number == source_funding_instrument.revision_number,
            OpportunitySummary.is_forecast == source_funding_instrument.is_forecast,
            OpportunitySummary.opportunity_id == source_funding_instrument.opportunity_id,
        )
        .scalar()
    )

    link_funding_instrument = (
        db_session.query(LinkOpportunitySummaryFundingInstrument)
        .filter(
            LinkOpportunitySummaryFundingInstrument.legacy_funding_instrument_id
            == source_funding_instrument.legacy_funding_instrument_id,
            LinkOpportunitySummaryFundingInstrument.opportunity_summary_id
            == opportunity_summary_id,
        )
        .one_or_none()
    )

    if not expect_in_db:
        assert link_funding_instrument is None
        return

    assert link_funding_instrument is not None
    assert link_funding_instrument.funding_instrument == expected_funding_instrument

    validate_matching_fields(
        source_funding_instrument,
        link_funding_instrument,
        [("creator_id", "created_by"), ("last_upd_id", "updated_by")],
        expect_values_to_match,
    )


def validate_funding_category(
    db_session,
    source_funding_category,
    expect_in_db: bool = True,
    expected_funding_category: FundingCategory | None = None,
    was_processed: bool = True,
    expect_values_to_match: bool = True,
):
    assert (source_funding_category.transformed_at is not None) == was_processed

    # In order to properly find the link table value, need to first determine
    # the opportunity summary in a subquery
    opportunity_summary_id = (
        db_session.query(OpportunitySummary.opportunity_summary_id)
        .filter(
            OpportunitySummary.revision_number == source_funding_category.revision_number,
            OpportunitySummary.is_forecast == source_funding_category.is_forecast,
            OpportunitySummary.opportunity_id == source_funding_category.opportunity_id,
        )
        .scalar()
    )

    link_funding_category = (
        db_session.query(LinkOpportunitySummaryFundingCategory)
        .filter(
            LinkOpportunitySummaryFundingCategory.legacy_funding_category_id
            == source_funding_category.legacy_funding_category_id,
            LinkOpportunitySummaryFundingCategory.opportunity_summary_id == opportunity_summary_id,
        )
        .one_or_none()
    )

    if not expect_in_db:
        assert link_funding_category is None
        return

    assert link_funding_category is not None
    assert link_funding_category.funding_category == expected_funding_category

    validate_matching_fields(
        source_funding_category,
        link_funding_category,
        [("creator_id", "created_by"), ("last_upd_id", "updated_by")],
        expect_values_to_match,
    )


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
        opportunity1 = f.OpportunityFactory.create(opportunity_assistance_listings=[])
        cfda_insert1 = setup_cfda(create_existing=False, opportunity=opportunity1)
        cfda_insert2 = setup_cfda(create_existing=False, opportunity=opportunity1)
        cfda_update1 = setup_cfda(create_existing=True, opportunity=opportunity1)
        cfda_delete1 = setup_cfda(create_existing=True, is_delete=True, opportunity=opportunity1)
        cfda_update_already_processed1 = setup_cfda(
            create_existing=True, is_already_processed=True, opportunity=opportunity1
        )

        opportunity2 = f.OpportunityFactory.create(opportunity_assistance_listings=[])
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

        opportunity3 = f.OpportunityFactory.create(opportunity_assistance_listings=[])
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
        opportunity = f.OpportunityFactory.create(opportunity_assistance_listings=[])
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
        opportunity1 = f.OpportunityFactory.create(
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
        opportunity2 = f.OpportunityFactory.create(
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
        opportunity3 = f.OpportunityFactory.create(
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
        opportunity4 = f.OpportunityFactory.create(
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
        opportunity = f.OpportunityFactory.create(
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
        opportunity = f.OpportunityFactory.create(
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
        opportunity_summary_forecast = f.OpportunitySummaryFactory.create(
            is_forecast=True, revision_number=None, no_link_values=True
        )
        forecast_insert1 = setup_applicant_type(
            create_existing=False,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="00",
        )
        forecast_update1 = setup_applicant_type(
            create_existing=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="01",
            applicant_type=ApplicantType.COUNTY_GOVERNMENTS,
        )
        forecast_update2 = setup_applicant_type(
            create_existing=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="02",
            applicant_type=ApplicantType.CITY_OR_TOWNSHIP_GOVERNMENTS,
        )
        forecast_delete1 = setup_applicant_type(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="04",
            applicant_type=ApplicantType.SPECIAL_DISTRICT_GOVERNMENTS,
        )
        forecast_delete2 = setup_applicant_type(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="05",
            applicant_type=ApplicantType.INDEPENDENT_SCHOOL_DISTRICTS,
        )
        forecast_update_already_processed = setup_applicant_type(
            create_existing=True,
            is_already_processed=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="06",
            applicant_type=ApplicantType.PUBLIC_AND_STATE_INSTITUTIONS_OF_HIGHER_EDUCATION,
        )

        opportunity_summary_forecast_hist = f.OpportunitySummaryFactory.create(
            is_forecast=True, revision_number=3, no_link_values=True
        )
        forecast_hist_insert1 = setup_applicant_type(
            create_existing=False,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="07",
        )
        forecast_hist_update1 = setup_applicant_type(
            create_existing=True,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="08",
            applicant_type=ApplicantType.PUBLIC_AND_INDIAN_HOUSING_AUTHORITIES,
        )
        forecast_hist_update2 = setup_applicant_type(
            create_existing=True,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="11",
            applicant_type=ApplicantType.OTHER_NATIVE_AMERICAN_TRIBAL_ORGANIZATIONS,
        )
        forecast_hist_delete1 = setup_applicant_type(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="12",
            applicant_type=ApplicantType.NONPROFITS_NON_HIGHER_EDUCATION_WITH_501C3,
        )
        forecast_hist_delete_already_processed = setup_applicant_type(
            create_existing=False,
            is_delete=True,
            is_already_processed=True,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="13",
        )
        forecast_hist_duplicate_insert = setup_applicant_type(
            create_existing=False,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="08",
        )

        opportunity_summary_syn = f.OpportunitySummaryFactory.create(
            is_forecast=False, revision_number=None, no_link_values=True
        )
        syn_insert1 = setup_applicant_type(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="20",
        )
        syn_insert2 = setup_applicant_type(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="21",
        )
        syn_update1 = setup_applicant_type(
            create_existing=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="22",
            applicant_type=ApplicantType.FOR_PROFIT_ORGANIZATIONS_OTHER_THAN_SMALL_BUSINESSES,
        )
        syn_update2 = setup_applicant_type(
            create_existing=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="23",
            applicant_type=ApplicantType.SMALL_BUSINESSES,
        )
        syn_delete1 = setup_applicant_type(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="25",
            applicant_type=ApplicantType.OTHER,
        )
        syn_delete2 = setup_applicant_type(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="99",
            applicant_type=ApplicantType.UNRESTRICTED,
        )
        syn_delete_but_current_missing = setup_applicant_type(
            create_existing=False,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="07",
        )
        syn_update_already_processed = setup_applicant_type(
            create_existing=True,
            is_already_processed=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="08",
            applicant_type=ApplicantType.PUBLIC_AND_INDIAN_HOUSING_AUTHORITIES,
        )

        opportunity_summary_syn_hist = f.OpportunitySummaryFactory.create(
            is_forecast=False, revision_number=21, no_link_values=True
        )
        syn_hist_insert1 = setup_applicant_type(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="11",
        )
        syn_hist_update1 = setup_applicant_type(
            create_existing=True,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="12",
            applicant_type=ApplicantType.NONPROFITS_NON_HIGHER_EDUCATION_WITH_501C3,
        )
        syn_hist_update2 = setup_applicant_type(
            create_existing=True,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="13",
            applicant_type=ApplicantType.NONPROFITS_NON_HIGHER_EDUCATION_WITHOUT_501C3,
        )
        syn_hist_delete1 = setup_applicant_type(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="25",
            applicant_type=ApplicantType.OTHER,
        )
        syn_hist_delete2 = setup_applicant_type(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="99",
            applicant_type=ApplicantType.UNRESTRICTED,
        )
        syn_hist_insert_invalid_type = setup_applicant_type(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="X",
            applicant_type=ApplicantType.STATE_GOVERNMENTS,
        )

        transform_oracle_data_task.process_link_applicant_types()

        validate_applicant_type(
            db_session, forecast_insert1, expected_applicant_type=ApplicantType.STATE_GOVERNMENTS
        )
        validate_applicant_type(
            db_session,
            forecast_hist_insert1,
            expected_applicant_type=ApplicantType.FEDERALLY_RECOGNIZED_NATIVE_AMERICAN_TRIBAL_GOVERNMENTS,
        )
        validate_applicant_type(
            db_session,
            syn_insert1,
            expected_applicant_type=ApplicantType.PRIVATE_INSTITUTIONS_OF_HIGHER_EDUCATION,
        )
        validate_applicant_type(
            db_session, syn_insert2, expected_applicant_type=ApplicantType.INDIVIDUALS
        )
        validate_applicant_type(
            db_session,
            syn_hist_insert1,
            expected_applicant_type=ApplicantType.OTHER_NATIVE_AMERICAN_TRIBAL_ORGANIZATIONS,
        )

        validate_applicant_type(
            db_session, forecast_update1, expected_applicant_type=ApplicantType.COUNTY_GOVERNMENTS
        )
        validate_applicant_type(
            db_session,
            forecast_update2,
            expected_applicant_type=ApplicantType.CITY_OR_TOWNSHIP_GOVERNMENTS,
        )
        validate_applicant_type(
            db_session,
            forecast_hist_update1,
            expected_applicant_type=ApplicantType.PUBLIC_AND_INDIAN_HOUSING_AUTHORITIES,
        )
        validate_applicant_type(
            db_session,
            forecast_hist_update2,
            expected_applicant_type=ApplicantType.OTHER_NATIVE_AMERICAN_TRIBAL_ORGANIZATIONS,
        )
        validate_applicant_type(
            db_session,
            syn_update1,
            expected_applicant_type=ApplicantType.FOR_PROFIT_ORGANIZATIONS_OTHER_THAN_SMALL_BUSINESSES,
        )
        validate_applicant_type(
            db_session, syn_update2, expected_applicant_type=ApplicantType.SMALL_BUSINESSES
        )
        validate_applicant_type(
            db_session,
            syn_hist_update1,
            expected_applicant_type=ApplicantType.NONPROFITS_NON_HIGHER_EDUCATION_WITH_501C3,
        )
        validate_applicant_type(
            db_session,
            syn_hist_update2,
            expected_applicant_type=ApplicantType.NONPROFITS_NON_HIGHER_EDUCATION_WITHOUT_501C3,
        )

        validate_applicant_type(db_session, forecast_delete1, expect_in_db=False)
        validate_applicant_type(db_session, forecast_delete2, expect_in_db=False)
        validate_applicant_type(db_session, forecast_hist_delete1, expect_in_db=False)
        validate_applicant_type(db_session, syn_delete1, expect_in_db=False)
        validate_applicant_type(db_session, syn_delete2, expect_in_db=False)
        validate_applicant_type(db_session, syn_hist_delete1, expect_in_db=False)
        validate_applicant_type(db_session, syn_hist_delete2, expect_in_db=False)

        validate_applicant_type(
            db_session,
            forecast_update_already_processed,
            expected_applicant_type=ApplicantType.PUBLIC_AND_STATE_INSTITUTIONS_OF_HIGHER_EDUCATION,
            expect_values_to_match=False,
        )
        validate_applicant_type(
            db_session, forecast_hist_delete_already_processed, expect_in_db=False
        )
        validate_applicant_type(
            db_session,
            syn_update_already_processed,
            expected_applicant_type=ApplicantType.PUBLIC_AND_INDIAN_HOUSING_AUTHORITIES,
            expect_values_to_match=False,
        )

        validate_applicant_type(
            db_session, syn_delete_but_current_missing, expect_in_db=False, was_processed=False
        )
        validate_applicant_type(
            db_session, syn_hist_insert_invalid_type, expect_in_db=False, was_processed=False
        )

        validate_applicant_type(
            db_session, forecast_hist_duplicate_insert, expect_in_db=False, was_processed=True
        )

        metrics = transform_oracle_data_task.metrics
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_PROCESSED] == 23
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_DELETED] == 7
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_INSERTED] == 5
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_UPDATED] == 8
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_ERROR_COUNT] == 2
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_DUPLICATE_RECORDS_SKIPPED] == 1

        # Rerunning will only attempt to re-process the errors, so total+errors goes up by 2
        transform_oracle_data_task.process_link_applicant_types()
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_PROCESSED] == 25
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_DELETED] == 7
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_INSERTED] == 5
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_UPDATED] == 8
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_ERROR_COUNT] == 4
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_DUPLICATE_RECORDS_SKIPPED] == 1

    @pytest.mark.parametrize(
        "is_forecast,revision_number", [(True, None), (False, None), (True, 5), (False, 10)]
    )
    def test_process_applicant_types_but_current_missing(
        self, db_session, transform_oracle_data_task, is_forecast, revision_number
    ):
        opportunity_summary = f.OpportunitySummaryFactory.create(
            is_forecast=is_forecast, revision_number=revision_number, no_link_values=True
        )
        delete_but_current_missing = setup_applicant_type(
            create_existing=False,
            opportunity_summary=opportunity_summary,
            legacy_lookup_value="00",
            is_delete=True,
        )

        with pytest.raises(ValueError, match="Cannot delete applicant type as it does not exist"):
            transform_oracle_data_task.process_link_applicant_type(
                delete_but_current_missing, None, opportunity_summary
            )

    @pytest.mark.parametrize(
        "is_forecast,revision_number,legacy_lookup_value",
        [(True, None, "90"), (False, None, "xx"), (True, 5, "50"), (False, 10, "1")],
    )
    def test_process_applicant_types_but_invalid_lookup_value(
        self,
        db_session,
        transform_oracle_data_task,
        is_forecast,
        revision_number,
        legacy_lookup_value,
    ):
        opportunity_summary = f.OpportunitySummaryFactory.create(
            is_forecast=is_forecast, revision_number=revision_number, no_link_values=True
        )
        insert_but_invalid_value = setup_applicant_type(
            create_existing=False,
            opportunity_summary=opportunity_summary,
            legacy_lookup_value=legacy_lookup_value,
        )

        with pytest.raises(ValueError, match="Unrecognized applicant type"):
            transform_oracle_data_task.process_link_applicant_type(
                insert_but_invalid_value, None, opportunity_summary
            )


class TestTransformFundingInstrument(BaseTestClass):
    @pytest.fixture()
    def transform_oracle_data_task(
        self, db_session, enable_factory_create, truncate_opportunities
    ) -> TransformOracleDataTask:
        return TransformOracleDataTask(db_session)

    def test_process_funding_instruments(self, db_session, transform_oracle_data_task):
        opportunity_summary_forecast = f.OpportunitySummaryFactory.create(
            is_forecast=True, revision_number=None, no_link_values=True
        )
        forecast_insert1 = setup_funding_instrument(
            create_existing=False,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="CA",
        )
        forecast_update1 = setup_funding_instrument(
            create_existing=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="G",
            funding_instrument=FundingInstrument.GRANT,
        )
        forecast_delete1 = setup_funding_instrument(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="PC",
            funding_instrument=FundingInstrument.PROCUREMENT_CONTRACT,
        )
        forecast_update_already_processed = setup_funding_instrument(
            create_existing=True,
            is_already_processed=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="O",
            funding_instrument=FundingInstrument.OTHER,
        )

        opportunity_summary_forecast_hist = f.OpportunitySummaryFactory.create(
            is_forecast=True, revision_number=3, no_link_values=True
        )
        forecast_hist_insert1 = setup_funding_instrument(
            create_existing=False,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="G",
        )
        forecast_hist_delete1 = setup_funding_instrument(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="CA",
            funding_instrument=FundingInstrument.COOPERATIVE_AGREEMENT,
        )
        forecast_hist_delete_already_processed = setup_funding_instrument(
            create_existing=False,
            is_delete=True,
            is_already_processed=True,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="O",
        )
        syn_delete_but_current_missing = setup_funding_instrument(
            create_existing=False,
            is_delete=True,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="PC",
        )

        opportunity_summary_syn = f.OpportunitySummaryFactory.create(
            is_forecast=False, revision_number=None, no_link_values=True
        )
        syn_insert1 = setup_funding_instrument(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="O",
        )
        syn_insert2 = setup_funding_instrument(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="G",
        )
        syn_delete1 = setup_funding_instrument(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="CA",
            funding_instrument=FundingInstrument.COOPERATIVE_AGREEMENT,
        )
        syn_update_already_processed = setup_funding_instrument(
            create_existing=True,
            is_already_processed=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="PC",
            funding_instrument=FundingInstrument.PROCUREMENT_CONTRACT,
        )

        opportunity_summary_syn_hist = f.OpportunitySummaryFactory.create(
            is_forecast=False, revision_number=21, no_link_values=True
        )
        syn_hist_insert1 = setup_funding_instrument(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="CA",
        )
        syn_hist_update1 = setup_funding_instrument(
            create_existing=True,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="O",
            funding_instrument=FundingInstrument.OTHER,
        )
        syn_hist_delete1 = setup_funding_instrument(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="PC",
            funding_instrument=FundingInstrument.PROCUREMENT_CONTRACT,
        )
        syn_hist_delete2 = setup_funding_instrument(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="G",
            funding_instrument=FundingInstrument.GRANT,
        )
        syn_hist_insert_invalid_type = setup_funding_instrument(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="X",
        )

        transform_oracle_data_task.process_link_funding_instruments()

        validate_funding_instrument(
            db_session,
            forecast_insert1,
            expected_funding_instrument=FundingInstrument.COOPERATIVE_AGREEMENT,
        )
        validate_funding_instrument(
            db_session, forecast_hist_insert1, expected_funding_instrument=FundingInstrument.GRANT
        )
        validate_funding_instrument(
            db_session, syn_insert1, expected_funding_instrument=FundingInstrument.OTHER
        )
        validate_funding_instrument(
            db_session, syn_insert2, expected_funding_instrument=FundingInstrument.GRANT
        )
        validate_funding_instrument(
            db_session,
            syn_hist_insert1,
            expected_funding_instrument=FundingInstrument.COOPERATIVE_AGREEMENT,
        )

        validate_funding_instrument(
            db_session, forecast_update1, expected_funding_instrument=FundingInstrument.GRANT
        )
        validate_funding_instrument(
            db_session, syn_hist_update1, expected_funding_instrument=FundingInstrument.OTHER
        )

        validate_funding_instrument(db_session, forecast_delete1, expect_in_db=False)
        validate_funding_instrument(db_session, forecast_hist_delete1, expect_in_db=False)
        validate_funding_instrument(db_session, syn_delete1, expect_in_db=False)
        validate_funding_instrument(db_session, syn_hist_delete1, expect_in_db=False)
        validate_funding_instrument(db_session, syn_hist_delete2, expect_in_db=False)

        validate_funding_instrument(
            db_session,
            forecast_update_already_processed,
            expected_funding_instrument=FundingInstrument.OTHER,
            expect_values_to_match=False,
        )
        validate_funding_instrument(
            db_session, forecast_hist_delete_already_processed, expect_in_db=False
        )
        validate_funding_instrument(
            db_session,
            syn_update_already_processed,
            expected_funding_instrument=FundingInstrument.PROCUREMENT_CONTRACT,
            expect_values_to_match=False,
        )

        validate_funding_instrument(
            db_session, syn_delete_but_current_missing, expect_in_db=False, was_processed=False
        )
        validate_funding_instrument(
            db_session, syn_hist_insert_invalid_type, expect_in_db=False, was_processed=False
        )

        metrics = transform_oracle_data_task.metrics
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_PROCESSED] == 14
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_DELETED] == 5
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_INSERTED] == 5
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_UPDATED] == 2
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_ERROR_COUNT] == 2

        # Rerunning will only attempt to re-process the errors, so total+errors goes up by 2
        transform_oracle_data_task.process_link_funding_instruments()
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_PROCESSED] == 16
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_DELETED] == 5
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_INSERTED] == 5
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_UPDATED] == 2
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_ERROR_COUNT] == 4

    @pytest.mark.parametrize(
        "is_forecast,revision_number", [(True, None), (False, None), (True, 1), (False, 4)]
    )
    def test_process_funding_instrument_but_current_missing(
        self, db_session, transform_oracle_data_task, is_forecast, revision_number
    ):
        opportunity_summary = f.OpportunitySummaryFactory.create(
            is_forecast=is_forecast, revision_number=revision_number, no_link_values=True
        )
        delete_but_current_missing = setup_funding_instrument(
            create_existing=False,
            opportunity_summary=opportunity_summary,
            legacy_lookup_value="G",
            is_delete=True,
        )

        with pytest.raises(
            ValueError, match="Cannot delete funding instrument as it does not exist"
        ):
            transform_oracle_data_task.process_link_funding_instrument(
                delete_but_current_missing, None, opportunity_summary
            )

    @pytest.mark.parametrize(
        "is_forecast,revision_number,legacy_lookup_value",
        [(True, None, "X"), (False, None, "4"), (True, 5, "Y"), (False, 10, "A")],
    )
    def test_process_applicant_types_but_invalid_lookup_value(
        self,
        db_session,
        transform_oracle_data_task,
        is_forecast,
        revision_number,
        legacy_lookup_value,
    ):
        opportunity_summary = f.OpportunitySummaryFactory.create(
            is_forecast=is_forecast, revision_number=revision_number, no_link_values=True
        )
        insert_but_invalid_value = setup_funding_instrument(
            create_existing=False,
            opportunity_summary=opportunity_summary,
            legacy_lookup_value=legacy_lookup_value,
        )

        with pytest.raises(ValueError, match="Unrecognized funding instrument"):
            transform_oracle_data_task.process_link_funding_instrument(
                insert_but_invalid_value, None, opportunity_summary
            )


class TestTransformFundingCategory(BaseTestClass):
    @pytest.fixture()
    def transform_oracle_data_task(
        self, db_session, enable_factory_create, truncate_opportunities
    ) -> TransformOracleDataTask:
        return TransformOracleDataTask(db_session)

    def test_process_funding_categories(self, db_session, transform_oracle_data_task):
        opportunity_summary_forecast = f.OpportunitySummaryFactory.create(
            is_forecast=True, revision_number=None, no_link_values=True
        )
        forecast_insert1 = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="RA",
        )
        forecast_insert2 = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="AG",
        )
        forecast_update1 = setup_funding_category(
            create_existing=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="AR",
            funding_category=FundingCategory.ARTS,
        )
        forecast_delete1 = setup_funding_category(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="BC",
            funding_category=FundingCategory.BUSINESS_AND_COMMERCE,
        )
        forecast_delete2 = setup_funding_category(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="CD",
            funding_category=FundingCategory.COMMUNITY_DEVELOPMENT,
        )
        forecast_update_already_processed = setup_funding_category(
            create_existing=True,
            is_already_processed=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="CP",
            funding_category=FundingCategory.CONSUMER_PROTECTION,
        )

        opportunity_summary_forecast_hist = f.OpportunitySummaryFactory.create(
            is_forecast=True, revision_number=3, no_link_values=True
        )
        forecast_hist_insert1 = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="DPR",
        )
        forecast_hist_insert2 = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="ED",
        )
        forecast_hist_update1 = setup_funding_category(
            create_existing=True,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="ELT",
            funding_category=FundingCategory.EMPLOYMENT_LABOR_AND_TRAINING,
        )
        forecast_hist_delete1 = setup_funding_category(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="EN",
            funding_category=FundingCategory.ENERGY,
        )
        forecast_hist_delete_already_processed = setup_funding_category(
            create_existing=False,
            is_delete=True,
            is_already_processed=True,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="ENV",
        )

        opportunity_summary_syn = f.OpportunitySummaryFactory.create(
            is_forecast=False, revision_number=None, no_link_values=True
        )
        syn_insert1 = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="FN",
        )
        syn_insert2 = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="HL",
        )
        syn_update1 = setup_funding_category(
            create_existing=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="HO",
            funding_category=FundingCategory.HOUSING,
        )
        syn_delete1 = setup_funding_category(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="HU",
            funding_category=FundingCategory.HUMANITIES,
        )
        syn_delete2 = setup_funding_category(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="IIJ",
            funding_category=FundingCategory.INFRASTRUCTURE_INVESTMENT_AND_JOBS_ACT,
        )
        syn_delete_but_current_missing = setup_funding_category(
            create_existing=False,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="IS",
        )
        syn_update_already_processed = setup_funding_category(
            create_existing=True,
            is_already_processed=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="ISS",
            funding_category=FundingCategory.INCOME_SECURITY_AND_SOCIAL_SERVICES,
        )

        opportunity_summary_syn_hist = f.OpportunitySummaryFactory.create(
            is_forecast=False, revision_number=21, no_link_values=True
        )
        syn_hist_insert1 = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="LJL",
        )
        syn_hist_insert2 = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="NR",
        )
        syn_hist_insert3 = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="OZ",
        )
        syn_hist_update1 = setup_funding_category(
            create_existing=True,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="RD",
            funding_category=FundingCategory.REGIONAL_DEVELOPMENT,
        )

        syn_hist_delete1 = setup_funding_category(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="ST",
            funding_category=FundingCategory.SCIENCE_TECHNOLOGY_AND_OTHER_RESEARCH_AND_DEVELOPMENT,
        )
        syn_hist_delete2 = setup_funding_category(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="T",
            funding_category=FundingCategory.TRANSPORTATION,
        )
        syn_hist_insert_invalid_type = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="XYZ",
            funding_category=FundingCategory.HEALTH,
        )

        transform_oracle_data_task.process_link_funding_categories()

        validate_funding_category(
            db_session, forecast_insert1, expected_funding_category=FundingCategory.RECOVERY_ACT
        )
        validate_funding_category(
            db_session, forecast_insert2, expected_funding_category=FundingCategory.AGRICULTURE
        )
        validate_funding_category(
            db_session,
            forecast_hist_insert1,
            expected_funding_category=FundingCategory.DISASTER_PREVENTION_AND_RELIEF,
        )
        validate_funding_category(
            db_session, forecast_hist_insert2, expected_funding_category=FundingCategory.EDUCATION
        )
        validate_funding_category(
            db_session, syn_insert1, expected_funding_category=FundingCategory.FOOD_AND_NUTRITION
        )
        validate_funding_category(
            db_session, syn_insert2, expected_funding_category=FundingCategory.HEALTH
        )
        validate_funding_category(
            db_session,
            syn_hist_insert1,
            expected_funding_category=FundingCategory.LAW_JUSTICE_AND_LEGAL_SERVICES,
        )
        validate_funding_category(
            db_session,
            syn_hist_insert2,
            expected_funding_category=FundingCategory.NATURAL_RESOURCES,
        )
        validate_funding_category(
            db_session,
            syn_hist_insert3,
            expected_funding_category=FundingCategory.OPPORTUNITY_ZONE_BENEFITS,
        )

        validate_funding_category(
            db_session, forecast_update1, expected_funding_category=FundingCategory.ARTS
        )
        validate_funding_category(
            db_session,
            forecast_hist_update1,
            expected_funding_category=FundingCategory.EMPLOYMENT_LABOR_AND_TRAINING,
        )
        validate_funding_category(
            db_session, syn_update1, expected_funding_category=FundingCategory.HOUSING
        )
        validate_funding_category(
            db_session,
            syn_hist_update1,
            expected_funding_category=FundingCategory.REGIONAL_DEVELOPMENT,
        )

        validate_funding_category(db_session, forecast_delete1, expect_in_db=False)
        validate_funding_category(db_session, forecast_delete2, expect_in_db=False)
        validate_funding_category(db_session, forecast_hist_delete1, expect_in_db=False)
        validate_funding_category(db_session, syn_delete1, expect_in_db=False)
        validate_funding_category(db_session, syn_delete2, expect_in_db=False)
        validate_funding_category(db_session, syn_hist_delete1, expect_in_db=False)
        validate_funding_category(db_session, syn_hist_delete2, expect_in_db=False)

        validate_funding_category(
            db_session,
            forecast_update_already_processed,
            expected_funding_category=FundingCategory.CONSUMER_PROTECTION,
            expect_values_to_match=False,
        )
        validate_funding_category(
            db_session, forecast_hist_delete_already_processed, expect_in_db=False
        )
        validate_funding_category(
            db_session,
            syn_update_already_processed,
            expected_funding_category=FundingCategory.INCOME_SECURITY_AND_SOCIAL_SERVICES,
            expect_values_to_match=False,
        )

        validate_funding_category(
            db_session, syn_delete_but_current_missing, expect_in_db=False, was_processed=False
        )
        validate_funding_category(
            db_session, syn_hist_insert_invalid_type, expect_in_db=False, was_processed=False
        )

        metrics = transform_oracle_data_task.metrics
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_PROCESSED] == 22
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_DELETED] == 7
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_INSERTED] == 9
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_UPDATED] == 4
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_ERROR_COUNT] == 2

        # Rerunning will only attempt to re-process the errors, so total+errors goes up by 2
        transform_oracle_data_task.process_link_funding_categories()
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_PROCESSED] == 24
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_DELETED] == 7
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_INSERTED] == 9
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_UPDATED] == 4
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_ERROR_COUNT] == 4

    @pytest.mark.parametrize(
        "is_forecast,revision_number", [(True, None), (False, None), (True, 1), (False, 70)]
    )
    def test_process_applicant_types_but_current_missing(
        self, db_session, transform_oracle_data_task, is_forecast, revision_number
    ):
        opportunity_summary = f.OpportunitySummaryFactory.create(
            is_forecast=is_forecast, revision_number=revision_number, no_link_values=True
        )
        delete_but_current_missing = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary,
            legacy_lookup_value="00",
            is_delete=True,
        )

        with pytest.raises(ValueError, match="Cannot delete funding category as it does not exist"):
            transform_oracle_data_task.process_link_funding_category(
                delete_but_current_missing, None, opportunity_summary
            )

    @pytest.mark.parametrize(
        "is_forecast,revision_number,legacy_lookup_value",
        [(True, None, "ab"), (False, None, "cd"), (True, 5, "ef"), (False, 10, "Ag")],
    )
    def test_process_applicant_types_but_invalid_lookup_value(
        self,
        db_session,
        transform_oracle_data_task,
        is_forecast,
        revision_number,
        legacy_lookup_value,
    ):
        opportunity_summary = f.OpportunitySummaryFactory.create(
            is_forecast=is_forecast, revision_number=revision_number, no_link_values=True
        )
        insert_but_invalid_value = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary,
            legacy_lookup_value=legacy_lookup_value,
        )

        with pytest.raises(ValueError, match="Unrecognized funding category"):
            transform_oracle_data_task.process_link_funding_category(
                insert_but_invalid_value, None, opportunity_summary
            )


class TestTransformFullRunTask(BaseTestClass):
    # The above tests validated we could run the tests

    @pytest.fixture()
    def truncate_all_staging_tables(self, db_session):
        # Iterate over all the staging tables and truncate them to avoid
        # any collisions with prior test data. There are no foreign keys
        # between these tables, so the order doesn't matter here.
        for table in staging.metadata.tables.values():
            db_session.query(table).delete()

    @pytest.fixture()
    def transform_oracle_data_task(
        self, db_session, enable_factory_create, truncate_opportunities, truncate_all_staging_tables
    ) -> TransformOracleDataTask:
        return TransformOracleDataTask(db_session)

    def test_all_inserts(self, db_session, transform_oracle_data_task):
        # Test that we're fully capable of processing inserts across an entire opportunity record
        opportunity = setup_opportunity(create_existing=False)

        cfda1 = setup_cfda(create_existing=False, opportunity=opportunity)
        cfda2 = setup_cfda(create_existing=False, opportunity=opportunity)

        ### Forecast
        forecast = setup_synopsis_forecast(
            create_existing=False, is_forecast=True, revision_number=None, opportunity=opportunity
        )
        f.StagingTapplicanttypesForecastFactory(forecast=forecast, at_id="01")
        # This is a duplicate record (same at_id, but will have a different at_frcst_id), verifying we handle duplicates
        f.StagingTapplicanttypesForecastFactory(forecast=forecast, at_id="01")
        f.StagingTfundactcatForecastFactory(forecast=forecast, fac_id="RA")
        f.StagingTfundactcatForecastFactory(forecast=forecast, fac_id="HO")
        # Duplicate here too
        f.StagingTfundactcatForecastFactory(forecast=forecast, fac_id="HO")

        f.StagingTfundinstrForecastFactory(forecast=forecast, fi_id="CA")
        f.StagingTfundinstrForecastFactory(forecast=forecast, fi_id="G")
        # Duplicate here as well
        f.StagingTfundinstrForecastFactory(forecast=forecast, fi_id="G")

        ### Forecast Hist 1 (only applicant types)
        forecast_hist1 = setup_synopsis_forecast(
            create_existing=False, is_forecast=True, revision_number=1, opportunity=opportunity
        )
        f.StagingTapplicanttypesForecastHistFactory(forecast=forecast_hist1, at_id="05")
        f.StagingTapplicanttypesForecastHistFactory(forecast=forecast_hist1, at_id="06")
        f.StagingTapplicanttypesForecastHistFactory(forecast=forecast_hist1, at_id="25")
        f.StagingTapplicanttypesForecastHistFactory(forecast=forecast_hist1, at_id="13")
        f.StagingTapplicanttypesForecastHistFactory(forecast=forecast_hist1, at_id="11")

        ### Forecast Hist 2 (only funding instrument and funding categories)
        forecast_hist2 = setup_synopsis_forecast(
            create_existing=False, is_forecast=True, revision_number=2, opportunity=opportunity
        )
        f.StagingTfundactcatForecastHistFactory(forecast=forecast_hist2, fac_id="ED")
        f.StagingTfundactcatForecastHistFactory(forecast=forecast_hist2, fac_id="HU")
        f.StagingTfundactcatForecastHistFactory(forecast=forecast_hist2, fac_id="IIJ")
        f.StagingTfundactcatForecastHistFactory(forecast=forecast_hist2, fac_id="T")
        f.StagingTfundinstrForecastHistFactory(forecast=forecast_hist2, fi_id="G")
        f.StagingTfundinstrForecastHistFactory(forecast=forecast_hist2, fi_id="CA")
        f.StagingTfundinstrForecastHistFactory(forecast=forecast_hist2, fi_id="PC")

        ### Synopsis (has some invalid values)
        synopsis = setup_synopsis_forecast(
            create_existing=False, is_forecast=False, revision_number=None, opportunity=opportunity
        )
        f.StagingTapplicanttypesSynopsisFactory(synopsis=synopsis, at_id="06")
        f.StagingTapplicanttypesSynopsisFactory(synopsis=synopsis, at_id="07")
        f.StagingTapplicanttypesSynopsisFactory(synopsis=synopsis, at_id="11")
        # Invalid value
        f.StagingTapplicanttypesSynopsisFactory(synopsis=synopsis, at_id="x")
        f.StagingTfundactcatSynopsisFactory(synopsis=synopsis, fac_id="ACA")
        f.StagingTfundactcatSynopsisFactory(synopsis=synopsis, fac_id="O")
        # Invalid value
        f.StagingTfundactcatSynopsisFactory(synopsis=synopsis, fac_id="BOB")
        f.StagingTfundinstrSynopsisFactory(synopsis=synopsis, fi_id="G")
        # Invalid value
        f.StagingTfundinstrSynopsisFactory(synopsis=synopsis, fi_id="x")

        # Synopsis Hist (has no link values, is also marked as deleted)
        synopsis_hist = setup_synopsis_forecast(
            create_existing=False, is_forecast=False, revision_number=5, opportunity=opportunity
        )

        transform_oracle_data_task.run()

        created_opportunity: Opportunity = (
            db_session.query(Opportunity)
            .filter(Opportunity.opportunity_id == opportunity.opportunity_id)
            .one_or_none()
        )

        # Validate that all of the expected records were created
        # not worrying about all of the transforms specifically here,
        # just that everything is in place

        assert created_opportunity is not None
        validate_opportunity(db_session, opportunity)
        assert {
            al.opportunity_assistance_listing_id
            for al in created_opportunity.opportunity_assistance_listings
        } == {cfda1.opp_cfda_id, cfda2.opp_cfda_id}

        assert len(created_opportunity.all_opportunity_summaries) == 5

        created_forecast = get_summary_from_source(db_session, forecast)
        assert created_forecast is not None
        validate_summary_and_nested(
            db_session,
            forecast,
            [ApplicantType.COUNTY_GOVERNMENTS],
            [FundingCategory.RECOVERY_ACT, FundingCategory.HOUSING],
            [FundingInstrument.GRANT, FundingInstrument.COOPERATIVE_AGREEMENT],
        )
        validate_summary_and_nested(
            db_session,
            forecast_hist1,
            [
                ApplicantType.OTHER,
                ApplicantType.INDEPENDENT_SCHOOL_DISTRICTS,
                ApplicantType.PUBLIC_AND_STATE_INSTITUTIONS_OF_HIGHER_EDUCATION,
                ApplicantType.NONPROFITS_NON_HIGHER_EDUCATION_WITHOUT_501C3,
                ApplicantType.OTHER_NATIVE_AMERICAN_TRIBAL_ORGANIZATIONS,
            ],
            [],
            [],
        )
        validate_summary_and_nested(
            db_session,
            forecast_hist2,
            [],
            [
                FundingCategory.TRANSPORTATION,
                FundingCategory.EDUCATION,
                FundingCategory.INFRASTRUCTURE_INVESTMENT_AND_JOBS_ACT,
                FundingCategory.HUMANITIES,
            ],
            [
                FundingInstrument.COOPERATIVE_AGREEMENT,
                FundingInstrument.GRANT,
                FundingInstrument.PROCUREMENT_CONTRACT,
            ],
        )
        validate_summary_and_nested(
            db_session,
            synopsis,
            [
                ApplicantType.PUBLIC_AND_STATE_INSTITUTIONS_OF_HIGHER_EDUCATION,
                ApplicantType.FEDERALLY_RECOGNIZED_NATIVE_AMERICAN_TRIBAL_GOVERNMENTS,
                ApplicantType.OTHER_NATIVE_AMERICAN_TRIBAL_ORGANIZATIONS,
            ],
            [FundingCategory.AFFORDABLE_CARE_ACT, FundingCategory.OTHER],
            [FundingInstrument.GRANT],
        )
        validate_summary_and_nested(db_session, synopsis_hist, [], [], [])

        assert {
            transform_oracle_data_task.Metrics.TOTAL_RECORDS_PROCESSED: 37,
            transform_oracle_data_task.Metrics.TOTAL_RECORDS_INSERTED: 31,
            transform_oracle_data_task.Metrics.TOTAL_RECORDS_UPDATED: 0,
            transform_oracle_data_task.Metrics.TOTAL_RECORDS_DELETED: 0,
            transform_oracle_data_task.Metrics.TOTAL_DUPLICATE_RECORDS_SKIPPED: 3,
            transform_oracle_data_task.Metrics.TOTAL_RECORDS_ORPHANED: 0,
            transform_oracle_data_task.Metrics.TOTAL_ERROR_COUNT: 3,
        }.items() <= transform_oracle_data_task.metrics.items()

    def test_mix_of_inserts_updates_deletes(self, db_session, transform_oracle_data_task):
        existing_opportunity = f.OpportunityFactory(
            no_current_summary=True, opportunity_assistance_listings=[]
        )
        opportunity = f.StagingTopportunityFactory(
            opportunity_id=existing_opportunity.opportunity_id, cfdas=[]
        )

        cfda_insert = setup_cfda(create_existing=False, opportunity=existing_opportunity)
        cfda_update = setup_cfda(create_existing=True, opportunity=existing_opportunity)
        setup_cfda(create_existing=True, is_delete=True, opportunity=existing_opportunity)

        ### Forecast (update)
        summary_forecast = f.OpportunitySummaryFactory(
            is_forecast=True, opportunity=existing_opportunity, no_link_values=True
        )
        forecast_update = f.StagingTforecastFactory(opportunity=opportunity)

        ## Forecast applicant type
        # insert
        f.StagingTapplicanttypesForecastFactory(forecast=forecast_update, at_id="01")
        # update
        f.StagingTapplicanttypesForecastFactory(
            forecast=forecast_update, at_id="02", at_frcst_id=1000
        )
        f.LinkOpportunitySummaryApplicantTypeFactory(
            opportunity_summary=summary_forecast,
            applicant_type=ApplicantType.CITY_OR_TOWNSHIP_GOVERNMENTS,
            legacy_applicant_type_id=1000,
        )
        # delete
        f.StagingTapplicanttypesForecastFactory(
            forecast=forecast_update, at_id="04", at_frcst_id=1001, is_deleted=True
        )
        f.LinkOpportunitySummaryApplicantTypeFactory(
            opportunity_summary=summary_forecast,
            applicant_type=ApplicantType.SPECIAL_DISTRICT_GOVERNMENTS,
            legacy_applicant_type_id=1001,
        )

        ## Forecast funding category
        # insert
        f.StagingTfundactcatForecastFactory(forecast=forecast_update, fac_id="OZ")
        # update
        f.StagingTfundactcatForecastFactory(
            forecast=forecast_update, fac_id="NR", fac_frcst_id=2000
        )
        f.LinkOpportunitySummaryFundingCategoryFactory(
            opportunity_summary=summary_forecast,
            funding_category=FundingCategory.NATURAL_RESOURCES,
            legacy_funding_category_id=2000,
        )
        # delete
        f.StagingTfundactcatForecastFactory(
            forecast=forecast_update, fac_id="ST", fac_frcst_id=2001, is_deleted=True
        )
        f.LinkOpportunitySummaryFundingCategoryFactory(
            opportunity_summary=summary_forecast,
            funding_category=FundingCategory.SCIENCE_TECHNOLOGY_AND_OTHER_RESEARCH_AND_DEVELOPMENT,
            legacy_funding_category_id=2001,
        )

        ## Forecast funding instrument
        # insert
        f.StagingTfundinstrForecastFactory(forecast=forecast_update, fi_id="G")
        # update
        f.StagingTfundinstrForecastFactory(forecast=forecast_update, fi_id="CA", fi_frcst_id=3000)
        f.LinkOpportunitySummaryFundingInstrumentFactory(
            opportunity_summary=summary_forecast,
            funding_instrument=FundingInstrument.COOPERATIVE_AGREEMENT,
            legacy_funding_instrument_id=3000,
        )
        # delete
        f.StagingTfundinstrForecastFactory(
            forecast=forecast_update, fi_id="O", fi_frcst_id=3001, is_deleted=True
        )
        f.LinkOpportunitySummaryFundingInstrumentFactory(
            opportunity_summary=summary_forecast,
            funding_instrument=FundingInstrument.OTHER,
            legacy_funding_instrument_id=3001,
        )

        ### Forecast Hist (deleted)
        # note that by default the factory creates 1-3 of each link value, those will automatically get deleted uneventfully by cascades
        f.OpportunitySummaryFactory(
            is_forecast=True, revision_number=1, opportunity=existing_opportunity
        )
        forecast_hist_delete = f.StagingTforecastHistFactory(
            revision_number=1, is_deleted=True, opportunity=opportunity
        )

        ### Synopsis (not modified as the update was already processed)
        summary_synopsis = f.OpportunitySummaryFactory(
            is_forecast=False, opportunity=existing_opportunity, no_link_values=True
        )
        synopsis_already_processed = f.StagingTsynopsisFactory(
            opportunity=opportunity, already_transformed=True
        )

        ## Synopsis applicant type (many duplicates)
        # insert
        f.StagingTapplicanttypesSynopsisFactory(synopsis=synopsis_already_processed, at_id="99")
        f.StagingTapplicanttypesSynopsisFactory(synopsis=synopsis_already_processed, at_id="99")
        f.StagingTapplicanttypesSynopsisFactory(synopsis=synopsis_already_processed, at_id="99")
        # update
        f.StagingTapplicanttypesSynopsisFactory(
            synopsis=synopsis_already_processed, at_id="07", at_syn_id=1000
        )
        f.StagingTapplicanttypesSynopsisFactory(
            synopsis=synopsis_already_processed, at_id="07", at_syn_id=11000
        )
        f.LinkOpportunitySummaryApplicantTypeFactory(
            opportunity_summary=summary_synopsis,
            applicant_type=ApplicantType.FEDERALLY_RECOGNIZED_NATIVE_AMERICAN_TRIBAL_GOVERNMENTS,
            legacy_applicant_type_id=1000,
        )
        # delete
        f.StagingTapplicanttypesSynopsisFactory(
            synopsis=synopsis_already_processed, at_id="21", at_syn_id=1001, is_deleted=True
        )
        # this will actually error because we don't yet handle these dupe deletes
        f.StagingTapplicanttypesSynopsisFactory(
            synopsis=synopsis_already_processed, at_id="21", at_syn_id=11001, is_deleted=True
        )
        f.LinkOpportunitySummaryApplicantTypeFactory(
            opportunity_summary=summary_synopsis,
            applicant_type=ApplicantType.INDIVIDUALS,
            legacy_applicant_type_id=1001,
        )

        ## Synopsis funding category
        # insert
        f.StagingTfundactcatSynopsisFactory(synopsis=synopsis_already_processed, fac_id="IIJ")
        f.StagingTfundactcatSynopsisFactory(synopsis=synopsis_already_processed, fac_id="IIJ")
        f.StagingTfundactcatSynopsisFactory(synopsis=synopsis_already_processed, fac_id="IIJ")
        f.StagingTfundactcatSynopsisFactory(synopsis=synopsis_already_processed, fac_id="IIJ")
        # update
        f.StagingTfundactcatSynopsisFactory(
            synopsis=synopsis_already_processed, fac_id="FN", fac_syn_id=2000
        )
        f.StagingTfundactcatSynopsisFactory(
            synopsis=synopsis_already_processed, fac_id="FN", fac_syn_id=20000
        )
        f.StagingTfundactcatSynopsisFactory(
            synopsis=synopsis_already_processed, fac_id="FN", fac_syn_id=21000
        )
        f.StagingTfundactcatSynopsisFactory(
            synopsis=synopsis_already_processed, fac_id="FN", fac_syn_id=22000
        )
        f.LinkOpportunitySummaryFundingCategoryFactory(
            opportunity_summary=summary_synopsis,
            funding_category=FundingCategory.FOOD_AND_NUTRITION,
            legacy_funding_category_id=2000,
        )
        # delete
        f.StagingTfundactcatSynopsisFactory(
            synopsis=synopsis_already_processed, fac_id="HL", fac_syn_id=2001, is_deleted=True
        )
        f.LinkOpportunitySummaryFundingCategoryFactory(
            opportunity_summary=summary_synopsis,
            funding_category=FundingCategory.HEALTH,
            legacy_funding_category_id=2001,
        )

        ## Synopsis funding instrument
        # insert
        f.StagingTfundinstrSynopsisFactory(synopsis=synopsis_already_processed, fi_id="PC")
        f.StagingTfundinstrSynopsisFactory(synopsis=synopsis_already_processed, fi_id="PC")
        f.StagingTfundinstrSynopsisFactory(synopsis=synopsis_already_processed, fi_id="PC")
        f.StagingTfundinstrSynopsisFactory(synopsis=synopsis_already_processed, fi_id="PC")
        f.StagingTfundinstrSynopsisFactory(synopsis=synopsis_already_processed, fi_id="PC")
        # update
        f.StagingTfundinstrSynopsisFactory(
            synopsis=synopsis_already_processed, fi_id="O", fi_syn_id=3000
        )
        f.StagingTfundinstrSynopsisFactory(
            synopsis=synopsis_already_processed, fi_id="O", fi_syn_id=30000
        )
        f.StagingTfundinstrSynopsisFactory(
            synopsis=synopsis_already_processed, fi_id="O", fi_syn_id=31000
        )
        f.LinkOpportunitySummaryFundingInstrumentFactory(
            opportunity_summary=summary_synopsis,
            funding_instrument=FundingInstrument.OTHER,
            legacy_funding_instrument_id=3000,
        )
        # delete
        f.StagingTfundinstrSynopsisFactory(
            synopsis=synopsis_already_processed, fi_id="G", fi_syn_id=3001, is_deleted=True
        )
        f.LinkOpportunitySummaryFundingInstrumentFactory(
            opportunity_summary=summary_synopsis,
            funding_instrument=FundingInstrument.GRANT,
            legacy_funding_instrument_id=3001,
        )

        ### Synopsis Hist (Insert - no nested values created)
        synopsis_hist_insert = f.StagingTsynopsisHistFactory(opportunity=opportunity)

        transform_oracle_data_task.run()

        updated_opportunity: Opportunity = (
            db_session.query(Opportunity)
            .filter(Opportunity.opportunity_id == opportunity.opportunity_id)
            .one_or_none()
        )

        assert updated_opportunity is not None
        validate_opportunity(db_session, opportunity)
        assert {
            al.opportunity_assistance_listing_id
            for al in updated_opportunity.opportunity_assistance_listings
        } == {cfda_insert.opp_cfda_id, cfda_update.opp_cfda_id}

        validate_summary_and_nested(
            db_session,
            forecast_update,
            [ApplicantType.COUNTY_GOVERNMENTS, ApplicantType.CITY_OR_TOWNSHIP_GOVERNMENTS],
            [FundingCategory.OPPORTUNITY_ZONE_BENEFITS, FundingCategory.NATURAL_RESOURCES],
            [FundingInstrument.GRANT, FundingInstrument.COOPERATIVE_AGREEMENT],
        )
        validate_summary_and_nested(
            db_session, forecast_hist_delete, [], [], [], expect_in_db=False
        )
        validate_summary_and_nested(
            db_session,
            synopsis_already_processed,
            [
                ApplicantType.UNRESTRICTED,
                ApplicantType.FEDERALLY_RECOGNIZED_NATIVE_AMERICAN_TRIBAL_GOVERNMENTS,
            ],
            [
                FundingCategory.INFRASTRUCTURE_INVESTMENT_AND_JOBS_ACT,
                FundingCategory.FOOD_AND_NUTRITION,
            ],
            [FundingInstrument.PROCUREMENT_CONTRACT, FundingInstrument.OTHER],
            expect_values_to_match=False,
        )
        validate_summary_and_nested(db_session, synopsis_hist_insert, [], [], [])

        assert {
            transform_oracle_data_task.Metrics.TOTAL_RECORDS_PROCESSED: 41,
            transform_oracle_data_task.Metrics.TOTAL_RECORDS_INSERTED: 8,
            transform_oracle_data_task.Metrics.TOTAL_RECORDS_UPDATED: 9,
            transform_oracle_data_task.Metrics.TOTAL_RECORDS_DELETED: 8,
            transform_oracle_data_task.Metrics.TOTAL_DUPLICATE_RECORDS_SKIPPED: 15,
            transform_oracle_data_task.Metrics.TOTAL_RECORDS_ORPHANED: 0,
            transform_oracle_data_task.Metrics.TOTAL_ERROR_COUNT: 1,
        }.items() <= transform_oracle_data_task.metrics.items()
