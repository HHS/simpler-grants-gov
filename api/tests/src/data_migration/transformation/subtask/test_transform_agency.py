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
    @pytest.fixture()
    def transform_agency_hierarchy(self, transform_oracle_data_task):
        return TransformAgencyHierarchy(transform_oracle_data_task)

    def test_transform_records(self, db_session, transform_agency_hierarchy):
        # Create agencies with varying top-level agency codes
        [
            AgencyFactory.create(agency_code="DHS"),
            AgencyFactory.create(agency_code="DHS-ICE"),
            AgencyFactory.create(agency_code="DHS-ICE-123"),
            AgencyFactory.create(agency_code="ABC-ICE"),
        ]

        # Run the transformation
        transform_agency_hierarchy.transform_records()

        # Fetch the agencies again to verify the changes
        agency1 = db_session.query(Agency).filter(Agency.agency_code == "DHS").one_or_none()
        agency2 = db_session.query(Agency).filter(Agency.agency_code == "DHS-ICE").one_or_none()
        agency3 = db_session.query(Agency).filter(Agency.agency_code == "DHS-ICE-123").one_or_none()
        agency4 = db_session.query(Agency).filter(Agency.agency_code == "ABC-ICE").one_or_none()

        # Verify that the top-level agencies are set correctly
        assert agency1.top_level_agency_id is None
        assert agency2.top_level_agency_id == agency1.agency_id
        assert agency3.top_level_agency_id == agency1.agency_id
        assert agency4.top_level_agency_id is None

    def test_get_top_level_agency_code(self, transform_agency_hierarchy):
        assert transform_agency_hierarchy.get_top_level_agency_code("DHS-ICE") == "DHS"
        assert transform_agency_hierarchy.get_top_level_agency_code("DHS") is None


class TestTransformAgency(BaseTransformTestClass):
    @pytest.fixture()
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
        insert_test_agency = setup_agency("GDIT", create_existing=False)

        # Already processed fields are ones that were handled on a prior run and won't be updated
        # during this specific run
        update_agency1 = setup_agency("UPDATE-AGENCY-1", create_existing=True)
        update_agency2 = setup_agency(
            "UPDATE-AGENCY-2",
            create_existing=True,
            deleted_fields={"AgencyContactEMail2", "ldapGp", "description"},
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
        update_error2 = setup_agency(
            "UPDATE-ERROR-2", create_existing=True, source_values={"UnknownField": "xyz"}
        )

        transform_agency.run_subtask()

        validate_agency(db_session, insert_agency1)
        validate_agency(db_session, insert_agency2)
        validate_agency(db_session, insert_agency3)
        validate_agency(db_session, insert_agency4)
        validate_agency(db_session, insert_test_agency, is_test_agency=True)

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
        validate_agency(db_session, update_test_agency, is_test_agency=True)

        validate_agency(db_session, already_processed1, expect_values_to_match=False)
        validate_agency(db_session, already_processed2, expect_values_to_match=False)
        validate_agency(db_session, already_processed3, expect_values_to_match=False)

        validate_agency(db_session, insert_error, expect_in_db=False)
        validate_agency(db_session, update_error1, expect_values_to_match=False)
        validate_agency(db_session, update_error2, expect_values_to_match=False)

        metrics = transform_agency.metrics
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 12
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 5
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 4
        assert metrics[transform_constants.Metrics.TOTAL_ERROR_COUNT] == 3

        # Rerunning does mostly nothing, it will attempt to re-process the three that errored
        # but otherwise won't find anything else
        db_session.commit()  # commit to end any existing transactions as run_subtask starts a new one
        transform_agency.run_subtask()

        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 15
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 5
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 4
        assert metrics[transform_constants.Metrics.TOTAL_ERROR_COUNT] == 6

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

    def test_process_tgroups_unknown_field(self, db_session, transform_agency):
        insert_that_will_fail = setup_agency(
            "ERROR-CASE-UNKNOWN-FIELD", create_existing=False, source_values={"MysteryField": "X"}
        )

        with pytest.raises(ValueError, match="Unknown tgroups agency field"):
            transform_agency.process_tgroups(
                TgroupAgency("ERROR-CASE-UNKNOWN-FIELD", insert_that_will_fail, has_update=True),
                None,
            )

        validate_agency(db_session, insert_that_will_fail, expect_in_db=False)

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
