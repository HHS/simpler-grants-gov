import logging
from datetime import datetime

import pytest

import src.data_migration.transformation.transform_constants as transform_constants
from src.constants.lookup_constants import (
    AgencyDownloadFileType,
    AgencySubmissionNotificationSetting,
)
from src.data_migration.transformation.subtask.transform_agency import (
    TgroupAgency,
    TransformAgency,
    TransformAgencyHierarchy,
    ValidateAgencyData,
    apply_updates,
    transform_agency_download_file_types,
    transform_agency_notify,
)
from src.db.models.agency_models import Agency
from tests.src.data_migration.transformation.conftest import (
    BaseTransformTestClass,
    setup_agency,
    validate_agency,
)
from tests.src.db.models.factories import AgencyFactory


class TestTransformAgencyHierarchy(BaseTransformTestClass):
    @pytest.fixture
    def transform_agency_hierarchy(self, transform_oracle_data_task):
        return TransformAgencyHierarchy(transform_oracle_data_task)

    def test_transform_records(self, db_session, transform_agency_hierarchy):
        # Create agencies with varying top-level agency codes
        parent_agency = AgencyFactory.create(agency_code="DHS")
        AgencyFactory.create(agency_code="DHS-ICE")
        AgencyFactory.create(agency_code="DHS--ICE")
        AgencyFactory.create(agency_code="DHS-ICE-123")
        AgencyFactory.create(agency_code="ABC-ICE")

        AgencyFactory.create(agency_code="SOMETHING-123-456", top_level_agency=parent_agency)

        # Run the transformation
        transform_agency_hierarchy.transform_records()

        # Fetch the agencies again to verify the changes
        agency1 = db_session.query(Agency).filter(Agency.agency_code == "DHS").one_or_none()
        agency2 = db_session.query(Agency).filter(Agency.agency_code == "DHS-ICE").one_or_none()
        agency3 = db_session.query(Agency).filter(Agency.agency_code == "DHS-ICE-123").one_or_none()
        agency4 = db_session.query(Agency).filter(Agency.agency_code == "ABC-ICE").one_or_none()
        agency5 = db_session.query(Agency).filter(Agency.agency_code == "DHS--ICE").one_or_none()
        agency6 = (
            db_session.query(Agency).filter(Agency.agency_code == "SOMETHING-123-456").one_or_none()
        )

        # Verify that the top-level agencies are set correctly
        assert agency1.top_level_agency_id is None
        assert agency2.top_level_agency_id == agency1.agency_id
        assert agency3.top_level_agency_id == agency1.agency_id
        assert agency4.top_level_agency_id is None
        assert agency5.top_level_agency_id == agency1.agency_id
        assert agency6.top_level_agency_id is None  # Verify this was unset

    def test_get_top_level_agency_code(self, transform_agency_hierarchy):
        assert transform_agency_hierarchy.get_top_level_agency_code("DHS-ICE") == "DHS"
        assert transform_agency_hierarchy.get_top_level_agency_code("DHS") is None

    def test_transform_records_test_agencies(self, db_session, transform_agency_hierarchy):
        # Note that our configuration has IVV as a test agency

        AgencyFactory.create(agency_code="IVV", is_test_agency=False)
        AgencyFactory.create(agency_code="IVV-123", is_test_agency=False)
        AgencyFactory.create(
            agency_code="IVVxyz", is_test_agency=False
        )  # despite being a different top-level, this also gets caught
        AgencyFactory.create(agency_code="NOTTEST", is_test_agency=False)
        AgencyFactory.create(agency_code="NOTTEST-123", is_test_agency=True)

        # Run the transformation
        transform_agency_hierarchy.transform_records()

        # Fetch the agencies again to verify the changes
        agency1 = db_session.query(Agency).filter(Agency.agency_code == "IVV").one_or_none()
        agency2 = db_session.query(Agency).filter(Agency.agency_code == "IVV-123").one_or_none()
        agency3 = db_session.query(Agency).filter(Agency.agency_code == "IVVxyz").one_or_none()
        agency4 = db_session.query(Agency).filter(Agency.agency_code == "NOTTEST").one_or_none()
        agency5 = db_session.query(Agency).filter(Agency.agency_code == "NOTTEST-123").one_or_none()

        assert agency1.is_test_agency is True
        assert agency2.is_test_agency is True
        assert agency3.is_test_agency is False
        assert agency4.is_test_agency is False
        assert agency5.is_test_agency is False


class TestTransformAgency(BaseTransformTestClass):
    @pytest.fixture
    def transform_agency(self, transform_oracle_data_task):
        return TransformAgency(transform_oracle_data_task)

    def test_process_agencies(self, db_session, transform_agency):
        insert_agency1 = setup_agency("INSERT-AGENCY-1", create_existing=False)
        insert_agency2 = setup_agency("INSERT-AGENCY-2", create_existing=False)
        insert_agency3 = setup_agency("INSERT-AGENCY-3", create_existing=False)
        insert_agency4 = setup_agency(
            "INSERT-AGENCY-4",
            create_existing=False,
            # None passed in here will make it not appear at all in the tgroups rows
            source_values={"ldapGp": None, "description": None, "label": None},
        )
        insert_test_agency_top = setup_agency("GDIT", create_existing=False)
        insert_test_agency = setup_agency("GDIT-xyz-123", create_existing=False)

        # Already processed fields are ones that were handled on a prior run and won't be updated
        # during this specific run
        update_agency1 = setup_agency("UPDATE-AGENCY-1", create_existing=True)
        update_agency2 = setup_agency(
            "UPDATE-AGENCY-2",
            create_existing=True,
            deleted_fields={"AgencyContactEMail2", "ldapGp", "description", "SAMValidation"},
            source_values={"SAMValidation": "1"},
        )
        update_agency3 = setup_agency(
            "UPDATE-AGENCY-3",
            create_existing=True,
            already_processed_fields={
                "AgencyName",
                "AgencyCFDA",
                "description",
                "AgencyContactName",
                "AgencyContactAddress1",
            },
        )
        # Test agency with ReviewProcessEnable field to ensure it's properly ignored
        update_agency_with_review_process = setup_agency(
            "UPDATE-AGENCY-REVIEW-PROCESS",
            create_existing=True,
            source_values={"ReviewProcessEnable": "Y", "AgencyName": "Agency with Review Process"},
        )
        # Test agency with ReviewProcessGoLive field to ensure it's properly ignored
        update_agency_with_review_process_go_live = setup_agency(
            "UPDATE-AGENCY-REVIEW-PROCESS-GO-LIVE",
            create_existing=True,
            source_values={
                "ReviewProcessGoLive": "Y",
                "AgencyName": "Agency with Review Process Go Live",
            },
        )
        # Test agency with EnableReviewProcess field to ensure it's properly ignored
        update_agency_with_enable_review_process = setup_agency(
            "UPDATE-AGENCY-ENABLE-REVIEW-PROCESS",
            create_existing=True,
            source_values={
                "EnableReviewProcess": "Y",
                "AgencyName": "Agency with Enable Review Process",
            },
        )
        # Test agency with ReviewProcessPeriod field to ensure it's properly ignored
        update_agency_with_review_process_period = setup_agency(
            "UPDATE-AGENCY-REVIEW-PROCESS-PERIOD",
            create_existing=True,
            source_values={
                "ReviewProcessPeriod": "30",
                "AgencyName": "Agency with Review Process Period",
            },
        )
        update_test_agency = setup_agency("SECSCAN", create_existing=True)

        already_processed1 = setup_agency(
            "ALREADY-PROCESSED-1", create_existing=True, is_already_processed=True
        )
        already_processed2 = setup_agency(
            "ALREADY-PROCESSED-2", create_existing=True, is_already_processed=True
        )
        already_processed3 = setup_agency(
            "ALREADY-PROCESSED-3", create_existing=True, is_already_processed=True
        )

        insert_error = setup_agency(
            "INSERT-ERROR", create_existing=False, source_values={"AgencyName": None}
        )
        update_error1 = setup_agency(
            "UPDATE-ERROR-1", create_existing=True, source_values={"AgencyDownload": "xyz"}
        )
        # This agency now has an unknown field but should process successfully (just skip the unknown field)
        update_with_unknown_field = setup_agency(
            "UPDATE-WITH-UNKNOWN-FIELD", create_existing=True, source_values={"UnknownField": "xyz"}
        )

        transform_agency.run_subtask()

        validate_agency(db_session, insert_agency1)
        validate_agency(db_session, insert_agency2)
        validate_agency(db_session, insert_agency3)
        validate_agency(db_session, insert_agency4)
        validate_agency(db_session, insert_test_agency_top, is_test_agency=True)
        validate_agency(db_session, insert_test_agency, is_test_agency=False)

        validate_agency(db_session, update_agency1)
        validate_agency(db_session, update_agency2, deleted_fields={"ldapGp", "description"})
        validate_agency(
            db_session,
            update_agency3,
            non_matching_fields={
                "AgencyName",
                "AgencyCFDA",
                "description",
                "AgencyContactName",
                "AgencyContactAddress1",
            },
        )
        # Validate that the agency with ReviewProcessEnable was processed successfully
        validate_agency(db_session, update_agency_with_review_process)
        # Validate that the agency with ReviewProcessGoLive was processed successfully
        validate_agency(db_session, update_agency_with_review_process_go_live)
        # Validate that the agency with EnableReviewProcess was processed successfully
        validate_agency(db_session, update_agency_with_enable_review_process)
        # Validate that the agency with ReviewProcessPeriod was processed successfully
        validate_agency(db_session, update_agency_with_review_process_period)
        validate_agency(db_session, update_test_agency, is_test_agency=True)

        validate_agency(db_session, already_processed1, expect_values_to_match=False)
        validate_agency(db_session, already_processed2, expect_values_to_match=False)
        validate_agency(db_session, already_processed3, expect_values_to_match=False)

        validate_agency(db_session, insert_error, expect_in_db=False)
        validate_agency(db_session, update_error1, expect_values_to_match=False)
        # This agency should now be processed successfully, just skipping the unknown field
        validate_agency(db_session, update_with_unknown_field)

        metrics = transform_agency.metrics
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 17
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 6
        assert (
            metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 9
        )  # One more successful update
        assert metrics[transform_constants.Metrics.TOTAL_ERROR_COUNT] == 2  # One fewer error

        # Rerunning does mostly nothing, it will attempt to re-process the two that errored
        # but otherwise won't find anything else
        db_session.commit()  # commit to end any existing transactions as run_subtask starts a new one
        transform_agency.run_subtask()

        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 19
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 6
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 9
        assert (
            metrics[transform_constants.Metrics.TOTAL_ERROR_COUNT] == 4
        )  # Two more errors from rerun

    def test_process_tgroups_missing_fields_for_insert(self, db_session, transform_agency):
        # Fields set to None don't get a tgroup record created
        insert_that_will_fail = setup_agency(
            "ERROR-CASE-MISSING-FIELDS",
            create_existing=False,
            source_values={"AgencyName": None, "AgencyContactCity": None},
        )

        with pytest.raises(
            ValueError,
            match="Cannot create agency ERROR-CASE-MISSING-FIELDS as required fields are missing",
        ):
            transform_agency.process_tgroups(
                TgroupAgency("ERROR-CASE-MISSING-FIELDS", insert_that_will_fail, has_update=True),
                None,
            )

        validate_agency(db_session, insert_that_will_fail, expect_in_db=False)

    def test_process_tgroups_unknown_field(self, db_session, transform_agency, caplog):
        insert_with_unknown_field = setup_agency(
            "AGENCY-WITH-UNKNOWN-FIELD", create_existing=False, source_values={"MysteryField": "X"}
        )

        # This should no longer raise an error, but should log a warning and continue processing
        transform_agency.process_tgroups(
            TgroupAgency("AGENCY-WITH-UNKNOWN-FIELD", insert_with_unknown_field, has_update=True),
            None,
        )

        # Verify the agency was created successfully (other required fields should still be processed)
        validate_agency(db_session, insert_with_unknown_field)

        # Verify that a warning was logged for the unknown field
        warning_logs = [record for record in caplog.records if record.levelname == "WARNING"]
        assert any(
            "Skipping unmapped field MysteryField" in record.getMessage() for record in warning_logs
        )

    def test_process_tgroups_disallowed_deleted_fields(self, db_session, transform_agency):
        update_that_will_fail = setup_agency(
            "ERROR-CASE-DELETED-FIELD", create_existing=True, deleted_fields={"AgencyContactCity"}
        )

        with pytest.raises(
            ValueError,
            match="Field AgencyContactCity in tgroups cannot be deleted as it is not nullable",
        ):
            transform_agency.process_tgroups(
                TgroupAgency("ERROR-CASE-DELETED-FIELD", update_that_will_fail, has_update=True),
                None,
            )

        validate_agency(db_session, update_that_will_fail, expect_values_to_match=False)

    def test_process_tgroups_invalid_file_type(self, db_session, transform_agency):
        insert_that_will_fail = setup_agency(
            "ERROR-CASE-BAD-DOWNLOAD", create_existing=False, source_values={"AgencyDownload": "X"}
        )

        with pytest.raises(ValueError, match="Unrecognized agency download file type value"):
            transform_agency.process_tgroups(
                TgroupAgency("ERROR-CASE-BAD-DOWNLOAD", insert_that_will_fail, has_update=True),
                None,
            )

        validate_agency(db_session, insert_that_will_fail, expect_in_db=False)

    def test_process_tgroups_invalid_agency_notify(self, db_session, transform_agency):
        insert_that_will_fail = setup_agency(
            "ERROR-CASE-BAD-NOTIFY", create_existing=False, source_values={"AgencyNotify": "4"}
        )

        with pytest.raises(ValueError, match="Unrecognized agency notify setting value"):
            transform_agency.process_tgroups(
                TgroupAgency("ERROR-CASE-BAD-NOTIFY", insert_that_will_fail, has_update=True), None
            )

        validate_agency(db_session, insert_that_will_fail, expect_in_db=False)

    def test_process_tgroups_known_unmapped_field(self, db_session, transform_agency, caplog):
        caplog.set_level(logging.INFO)
        """Test that fields in NOT_MAPPED_FIELDS are skipped with info logging"""
        # Use a field that's already being tested in the main test - ReviewProcessEnable is in NOT_MAPPED_FIELDS
        insert_with_known_unmapped = setup_agency(
            "AGENCY-WITH-KNOWN-UNMAPPED",
            create_existing=False,
            source_values={"ReviewProcessEnable": "Y"},  # This is in NOT_MAPPED_FIELDS
        )

        transform_agency.process_tgroups(
            TgroupAgency("AGENCY-WITH-KNOWN-UNMAPPED", insert_with_known_unmapped, has_update=True),
            None,
        )

        # Verify the agency was created successfully
        validate_agency(db_session, insert_with_known_unmapped)

        # Verify that an info log was generated for the known unmapped field
        info_logs = [record for record in caplog.records if record.levelname == "INFO"]
        assert any(
            "Skipping processing of field ReviewProcessEnable" in record.getMessage()
            for record in info_logs
        )

    def test_process_tgroups_truly_unknown_field(self, db_session, transform_agency, caplog):
        """Test that truly unknown fields are skipped with warning logging"""
        insert_with_unknown = setup_agency(
            "AGENCY-WITH-TRULY-UNKNOWN",
            create_existing=False,
            source_values={"CompletelyUnknownField": "value"},
        )

        transform_agency.process_tgroups(
            TgroupAgency("AGENCY-WITH-TRULY-UNKNOWN", insert_with_unknown, has_update=True),
            None,
        )

        # Verify the agency was created successfully
        validate_agency(db_session, insert_with_unknown)

        # Verify that a warning log was generated for the unknown field
        warning_logs = [record for record in caplog.records if record.levelname == "WARNING"]
        assert any(
            "Skipping unmapped field CompletelyUnknownField" in record.getMessage()
            for record in warning_logs
        )
        assert any(
            "consider adding to NOT_MAPPED_FIELDS if intentional" in record.getMessage()
            for record in warning_logs
        )


class TestValidateAgencyData(BaseTransformTestClass):

    @pytest.fixture
    def validate_agency_data(self, transform_oracle_data_task, truncate_agencies):
        return ValidateAgencyData(transform_oracle_data_task)

    def test_validate_agency_data_task(self, db_session, validate_agency_data, caplog):
        # Setup a few agencies without any issues
        top_level1 = AgencyFactory.create(agency_code="ABC")
        AgencyFactory.create(agency_code="ABC-123", top_level_agency=top_level1)

        top_level2 = AgencyFactory.create(agency_code="XYZ")

        top_level3 = AgencyFactory.create(agency_code="MNOP")
        AgencyFactory.create(agency_code="MNOP-222", top_level_agency=top_level3)
        AgencyFactory.create(agency_code="MNOP-333", top_level_agency=top_level3)
        AgencyFactory.create(agency_code="MNOP-444", top_level_agency=top_level3)

        # Agencies with a dash, but no parent
        orphaned_child1 = AgencyFactory.create(agency_code="HELLO-THERE")
        orphaned_child2 = AgencyFactory.create(agency_code="some-sort-of-agency")
        orphaned_child3 = AgencyFactory.create(
            agency_code="ABC-999"
        )  # ABC is a top-level created above, but it's not connected here

        # Agencies with a top-level but parent agency code isn't exactly the bit before the first dash in the child
        unexpected_top_level1 = AgencyFactory.create(
            agency_code="something-ABC", top_level_agency=top_level1
        )
        unexpected_top_level2 = AgencyFactory.create(
            agency_code="123-XYZ-456", top_level_agency=top_level2
        )
        unexpected_top_level3 = AgencyFactory.create(
            agency_code="ZYX-XYZ", top_level_agency=top_level2
        )
        unexpected_top_level4 = AgencyFactory.create(
            agency_code="MNOPXYZ-XYZ", top_level_agency=top_level3
        )

        # Agencies which look like a child agency shouldn't have a parent
        # Note that these will also trigger the parent-prefix issue
        unexpected_agency_with_parent1 = AgencyFactory.create(
            agency_code="BOB", top_level_agency=top_level1
        )
        unexpected_agency_with_parent2 = AgencyFactory.create(
            agency_code="FRED", top_level_agency=top_level2
        )
        unexpected_agency_with_parent3 = AgencyFactory.create(
            agency_code="JOE", top_level_agency=top_level3
        )

        validate_agency_data.run_subtask()

        # Pull agencies that hit each scenario out of the logs
        orphaned_child_agencies = [
            record.agency_code
            for record in caplog.records
            if record.message == "Likely child agency is orphaned and has no parent"
        ]
        agencies_with_unexpected_top_level = [
            record.agency_code
            for record in caplog.records
            if record.message == "Agency has unexpected top level agency"
        ]
        parent_with_parent_agencies = [
            record.agency_code
            for record in caplog.records
            if record.message == "Agency has a parent, but is not a child agency"
        ]

        assert set(orphaned_child_agencies) == {
            orphaned_child1.agency_code,
            orphaned_child2.agency_code,
            orphaned_child3.agency_code,
        }
        assert set(agencies_with_unexpected_top_level) == {
            unexpected_top_level1.agency_code,
            unexpected_top_level2.agency_code,
            unexpected_top_level3.agency_code,
            unexpected_top_level4.agency_code,
            unexpected_agency_with_parent1.agency_code,
            unexpected_agency_with_parent2.agency_code,
            unexpected_agency_with_parent3.agency_code,
        }
        assert set(parent_with_parent_agencies) == {
            unexpected_agency_with_parent1.agency_code,
            unexpected_agency_with_parent2.agency_code,
            unexpected_agency_with_parent3.agency_code,
        }

        metrics = validate_agency_data.metrics
        assert metrics[ValidateAgencyData.Metrics.AGENCY_VALIDATED_COUNT] == 17
        assert metrics[ValidateAgencyData.Metrics.ORPHANED_CHILD_AGENCY_COUNT] == 3
        assert metrics[ValidateAgencyData.Metrics.UNEXPECTED_TOP_LEVEL_AGENCY_COUNT] == 7
        assert metrics[ValidateAgencyData.Metrics.PARENT_WITH_PARENT_AGENCY_COUNT] == 3


@pytest.mark.parametrize(
    "value,expected_value",
    [
        ("0", set()),
        ("1", {AgencyDownloadFileType.XML}),
        ("2", {AgencyDownloadFileType.XML, AgencyDownloadFileType.PDF}),
        ("3", {AgencyDownloadFileType.PDF}),
    ],
)
def test_transform_agency_download_file_types(value, expected_value):
    assert transform_agency_download_file_types(value) == expected_value


@pytest.mark.parametrize("value", ["A", "B", "NULL", "", None])
def test_transform_agency_download_file_types_unexpected_values(value):
    with pytest.raises(ValueError, match="Unrecognized agency download file type value"):
        transform_agency_download_file_types(value)


@pytest.mark.parametrize(
    "value,expected_value",
    [
        ("1", AgencySubmissionNotificationSetting.NEVER),
        ("2", AgencySubmissionNotificationSetting.FIRST_APPLICATION_ONLY),
        ("3", AgencySubmissionNotificationSetting.ALWAYS),
    ],
)
def test_transform_agency_notify(value, expected_value):
    assert transform_agency_notify(value) == expected_value


@pytest.mark.parametrize("value", ["A", "B", "NULL", "", None])
def test_transform_agency_notify_unexpected_value(value):
    with pytest.raises(ValueError, match="Unrecognized agency notify setting value"):
        transform_agency_notify(value)


@pytest.mark.parametrize(
    "agency_created_at,agency_updated_at,created_at,updated_at,expect_created_at_to_change,expect_updated_at_to_change",
    [
        (None, None, None, None, False, False),
        (None, None, datetime.now(), datetime.now(), True, True),
        (
            datetime(2020, 1, 1),
            datetime(2021, 1, 1),
            datetime(2019, 12, 31),
            datetime(2021, 1, 2),
            False,
            True,
        ),
        (
            datetime(2020, 1, 1),
            datetime(2021, 1, 1),
            datetime(2020, 12, 31),
            datetime(2020, 1, 1),
            False,
            False,
        ),
    ],
)
def test_apply_updates_timestamps(
    agency_created_at,
    agency_updated_at,
    created_at,
    updated_at,
    expect_created_at_to_change,
    expect_updated_at_to_change,
):
    agency = AgencyFactory.build(created_at=agency_created_at, updated_at=agency_updated_at)

    apply_updates(agency, {}, created_at, updated_at)

    if expect_created_at_to_change:
        assert agency.created_at == created_at
    else:
        assert agency.created_at == agency_created_at

    if expect_updated_at_to_change:
        assert agency.updated_at == updated_at
    else:
        assert agency.updated_at == agency_updated_at
