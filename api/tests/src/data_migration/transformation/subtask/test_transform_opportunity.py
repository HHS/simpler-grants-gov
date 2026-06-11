import uuid

import pytest
from grants_shared.util import datetime_util
from sqlalchemy import update

import src.data_migration.transformation.transform_constants as transform_constants
from src.data_migration.transformation.subtask.transform_opportunity import (
    TransformOpportunity,
    TransformOpportunityAgencyConnection,
)
from src.db.models import staging
from src.db.models.opportunity_models import Opportunity
from src.services.competition_alpha.competition_instruction_util import (
    get_s3_competition_instruction_path,
)
from src.services.opportunity_attachments import attachment_util
from src.util import file_util
from tests.src.data_migration.transformation.conftest import (
    BaseTransformTestClass,
    setup_opportunity,
    validate_opportunity,
)
from tests.src.db.models.factories import (
    AgencyFactory,
    CompetitionFactory,
    CompetitionInstructionFactory,
    OpportunityAttachmentFactory,
    OpportunityFactory,
)


class TestTransformOpportunity(BaseTransformTestClass):

    @pytest.fixture(autouse=True)
    def clear_opportunities(self, db_session):
        # Mark any opportunity in the staging table as transformed so we'll
        # ignore it for these tests rather than try to cleanup the data.
        db_session.execute(
            update(staging.opportunity.Topportunity)
            .where(staging.opportunity.Topportunity.transformed_at.is_(None))
            .values(transformed_at=datetime_util.utcnow())
        )

    @pytest.fixture
    def transform_opportunity(self, transform_oracle_data_task, s3_config):
        return TransformOpportunity(transform_oracle_data_task, s3_config)

    def test_process_opportunities(self, db_session, transform_opportunity):
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

        transform_opportunity.run_subtask()

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

        metrics = transform_opportunity.metrics
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 11
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 2
        # Note this insert counts the case where the category fails
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 3
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 4
        assert metrics[transform_constants.Metrics.TOTAL_ERROR_COUNT] == 1
        assert metrics[transform_constants.Metrics.TOTAL_DELETE_ORPHANS_SKIPPED] == 1

        # Rerunning does mostly nothing, it will attempt to re-process the one that errored
        # but otherwise won't find anything else
        db_session.commit()  # commit to end any existing transactions as run_subtask starts a new one
        transform_opportunity.run_subtask()
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 12
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 2
        # Note this insert counts the case where the category fails
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 3
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 4
        assert metrics[transform_constants.Metrics.TOTAL_ERROR_COUNT] == 2
        assert metrics[transform_constants.Metrics.TOTAL_DELETE_ORPHANS_SKIPPED] == 1

    def test_process_opportunity_invalid_category(self, db_session, transform_opportunity):
        # This will error in the transform as that isn't a category we have configured
        insert_that_will_fail = setup_opportunity(
            create_existing=False, source_values={"oppcategory": "X"}
        )

        with pytest.raises(ValueError, match="Unrecognized opportunity category"):
            transform_opportunity.process_opportunity(insert_that_will_fail, None)

        validate_opportunity(db_session, insert_that_will_fail, expect_in_db=False)

    def test_process_opportunity_delete_with_attachments_and_instructions(
        self, db_session, transform_opportunity, s3_config
    ):

        source_opportunity = setup_opportunity(create_existing=False, is_delete=True)

        target_opportunity = OpportunityFactory.create(
            legacy_opportunity_id=source_opportunity.opportunity_id, opportunity_attachments=[]
        )

        attachments = []
        for i in range(3):
            s3_path = attachment_util.get_s3_attachment_path(
                f"my_file{i}.txt", i, target_opportunity, s3_config
            )

            with file_util.open_stream(s3_path, "w") as outfile:
                outfile.write(f"This is the {i}th file")

            attachment = OpportunityAttachmentFactory.create(
                opportunity=target_opportunity, file_location=s3_path
            )
            attachments.append(attachment)

        competition_instructions = []
        for _ in range(2):
            competition = CompetitionFactory.create(opportunity=target_opportunity)
            competition_instruction = CompetitionInstructionFactory.create(competition=competition)
            competition_instructions.append(competition_instruction)

        transform_opportunity.process_opportunity(source_opportunity, target_opportunity)

        validate_opportunity(db_session, source_opportunity, expect_in_db=False)

        # Verify all of the files were deleted
        for attachment in attachments:
            assert file_util.file_exists(attachment.file_location) is False

        for competition_instruction in competition_instructions:
            assert file_util.file_exists(competition_instruction.file_location) is False

    def test_process_opportunity_update_to_non_draft_with_attachments_and_instructions(
        self, db_session, transform_opportunity, s3_config
    ):

        source_opportunity = setup_opportunity(
            create_existing=False, source_values={"is_draft": "N"}
        )

        target_opportunity = OpportunityFactory.create(
            legacy_opportunity_id=source_opportunity.opportunity_id,
            is_draft=True,
            opportunity_attachments=[],
        )

        attachments = []
        for i in range(3):
            s3_path = attachment_util.get_s3_attachment_path(
                f"my_file{i}.txt", i, target_opportunity, s3_config
            )
            assert s3_path.startswith(s3_config.draft_files_bucket_path) is True

            with file_util.open_stream(s3_path, "w") as outfile:
                outfile.write(f"This is the {i}th file")

            attachment = OpportunityAttachmentFactory.create(
                opportunity=target_opportunity, file_location=s3_path
            )
            attachments.append(attachment)

        competition_instructions = []
        for i in range(2):
            competition = CompetitionFactory.create(opportunity=target_opportunity)

            s3_path = get_s3_competition_instruction_path(
                f"my_file{i}.txt", i, competition, s3_config
            )
            competition_instruction = CompetitionInstructionFactory.create(
                competition=competition, file_location=s3_path
            )
            competition_instructions.append(competition_instruction)

        transform_opportunity.process_opportunity(source_opportunity, target_opportunity)

        validate_opportunity(db_session, source_opportunity)

        # Verify all of the files were moved to the public bucket
        for attachment in attachments:
            assert attachment.file_location.startswith(s3_config.public_files_bucket_path) is True
            assert file_util.file_exists(attachment.file_location) is True

        for competition_instruction in competition_instructions:
            assert (
                competition_instruction.file_location.startswith(s3_config.public_files_bucket_path)
                is True
            )
            assert file_util.file_exists(competition_instruction.file_location) is True

    def test_process_opportunity_update_to_draft_with_attachments(
        self, db_session, transform_opportunity, s3_config
    ):

        source_opportunity = setup_opportunity(
            create_existing=False, source_values={"is_draft": "Y"}
        )

        target_opportunity = OpportunityFactory.create(
            legacy_opportunity_id=source_opportunity.opportunity_id,
            is_draft=False,
            opportunity_attachments=[],
        )

        attachments = []
        for i in range(10):
            s3_path = attachment_util.get_s3_attachment_path(
                f"my_file{i}.txt", i, target_opportunity, s3_config
            )
            assert s3_path.startswith(s3_config.public_files_bucket_path) is True

            with file_util.open_stream(s3_path, "w") as outfile:
                outfile.write(f"This is the {i}th file")

            attachment = OpportunityAttachmentFactory.create(
                opportunity=target_opportunity, file_location=s3_path
            )
            attachments.append(attachment)

        transform_opportunity.process_opportunity(source_opportunity, target_opportunity)

        validate_opportunity(db_session, source_opportunity)

        # Verify all of the files were moved to the draft bucket
        for attachment in attachments:
            assert attachment.file_location.startswith(s3_config.draft_files_bucket_path) is True
            assert file_util.file_exists(attachment.file_location) is True

    def test_process_opportunity_new_opportunity_existing_agency(
        self, db_session, transform_opportunity
    ):
        """Test that for a new opportunity, the proper agency gets attached if it exists"""
        agency = AgencyFactory.create()

        source_opportunity = setup_opportunity(
            create_existing=False, source_values={"owningagency": agency.agency_code}
        )

        transform_opportunity.process_opportunity(source_opportunity, None)

        validate_opportunity(db_session, source_opportunity, expected_agency=agency)

        assert (
            transform_opportunity.metrics[
                transform_opportunity.Metrics.OPPORTUNITY_TRANSFORMED_HAS_AGENCY
            ]
            == 1
        )

    def test_process_opportunity_new_opportunity_no_existing_agency(
        self, db_session, transform_opportunity
    ):
        """Test that for a new opportunity, no agency is attached if it doesn't exist"""
        source_opportunity = setup_opportunity(
            create_existing=False, source_values={"owningagency": str(uuid.uuid4())}
        )

        transform_opportunity.process_opportunity(source_opportunity, None)

        validate_opportunity(db_session, source_opportunity, expect_agency_id_to_be_set=False)

        assert (
            transform_opportunity.metrics[
                transform_opportunity.Metrics.OPPORTUNITY_TRANSFORMED_NULL_AGENCY
            ]
            == 1
        )

    def test_process_opportunity_update_opportunity_existing_agency(
        self, db_session, transform_opportunity
    ):
        """Test that for updating an opportunity, the proper agency gets attached if it exists"""
        agency = AgencyFactory.create()

        source_opportunity = setup_opportunity(
            create_existing=False, source_values={"owningagency": agency.agency_code}
        )
        target_opportunity = OpportunityFactory.create(
            legacy_opportunity_id=source_opportunity.opportunity_id,
            is_draft=False,
            agency_id=None,
            opportunity_attachments=[],
        )

        transform_opportunity.process_opportunity(source_opportunity, target_opportunity)

        validate_opportunity(db_session, source_opportunity, expected_agency=agency)

        assert (
            transform_opportunity.metrics[
                transform_opportunity.Metrics.OPPORTUNITY_TRANSFORMED_HAS_AGENCY
            ]
            == 1
        )

    def test_process_opportunity_update_opportunity_to_nonexistant_agency(
        self, db_session, transform_opportunity
    ):
        """Test that for updating an opportunity, we can null out the agency if it doesn't exist"""
        agency = AgencyFactory.create()

        source_opportunity = setup_opportunity(
            create_existing=False, source_values={"owningagency": str(uuid.uuid4())}
        )
        target_opportunity = OpportunityFactory.create(
            legacy_opportunity_id=source_opportunity.opportunity_id,
            is_draft=False,
            agency_id=agency.agency_id,
            opportunity_attachments=[],
        )

        transform_opportunity.process_opportunity(source_opportunity, target_opportunity)

        validate_opportunity(db_session, source_opportunity, expect_agency_id_to_be_set=False)

        assert (
            transform_opportunity.metrics[
                transform_opportunity.Metrics.OPPORTUNITY_TRANSFORMED_NULL_AGENCY
            ]
            == 1
        )


##############################################
# TransformOpportunityAgencyConnection test
##############################################


def validate_agency_connection(db_session, opportunity, expected_agency):
    db_session.refresh(opportunity)

    if expected_agency is not None:
        assert opportunity.agency_id == expected_agency.agency_id
    else:
        assert opportunity.agency_id is None


class TestTransformOpportunityAgencyConnection(BaseTransformTestClass):

    @pytest.fixture(autouse=True)
    def cleanup_opportunities(self, db_session, enable_factory_create):
        # We want to avoid this test fetch any other opportunities than
        # the ones we configured. Easiest way to do that is make it so
        # other opportunties all have their agency_id set.
        agency = AgencyFactory.create()

        # Update every agency with a null agency_id to the above agency
        db_session.execute(
            update(Opportunity)
            .values(agency_id=agency.agency_id, agency_code=agency.agency_code)
            .where(Opportunity.agency_id.is_(None))
        )
        db_session.commit()

    @pytest.fixture
    def transform_opportunity_agency_connection(self, transform_oracle_data_task):
        return TransformOpportunityAgencyConnection(transform_oracle_data_task)

    def test_transform_opportunity_agency_connection(
        self, db_session, transform_opportunity_agency_connection
    ):

        agency1 = AgencyFactory.create()
        agency2 = AgencyFactory.create()
        agency3 = AgencyFactory.create()

        opportunity1 = OpportunityFactory.create(agency_code=agency1.agency_code, agency_id=None)
        opportunity2 = OpportunityFactory.create(agency_code=agency1.agency_code, agency_id=None)
        opportunity3 = OpportunityFactory.create(agency_code=agency2.agency_code, agency_id=None)
        opportunity4 = OpportunityFactory.create(agency_code=agency3.agency_code, agency_id=None)
        opportunity5 = OpportunityFactory.create(agency_code=agency3.agency_code, agency_id=None)

        # These opportunities won't get modified - even if they're currently wrong
        opportunity6 = OpportunityFactory.create(
            agency_code=agency1.agency_code, agency_id=agency1.agency_id
        )
        # this is wrong
        opportunity7 = OpportunityFactory.create(
            agency_code=agency2.agency_code, agency_id=agency1.agency_id
        )
        opportunity8 = OpportunityFactory.create(
            agency_code=agency3.agency_code, agency_id=agency3.agency_id
        )

        # agency codes that don't match any agency, also aren't picked up (using UUIDs to be certain they're not in the DB)
        opportunity9 = OpportunityFactory.create(agency_code=str(uuid.uuid4()), agency_id=None)
        opportunity10 = OpportunityFactory.create(agency_code=str(uuid.uuid4()), agency_id=None)

        transform_opportunity_agency_connection.run()

        # All the processed opportunities
        validate_agency_connection(db_session, opportunity1, agency1)
        validate_agency_connection(db_session, opportunity2, agency1)
        validate_agency_connection(db_session, opportunity3, agency2)
        validate_agency_connection(db_session, opportunity4, agency3)
        validate_agency_connection(db_session, opportunity5, agency3)

        # None of these were touched
        validate_agency_connection(db_session, opportunity6, agency1)
        validate_agency_connection(db_session, opportunity7, agency1)
        validate_agency_connection(db_session, opportunity8, agency3)
        validate_agency_connection(db_session, opportunity9, None)
        validate_agency_connection(db_session, opportunity10, None)

        assert (
            transform_opportunity_agency_connection.metrics[
                transform_opportunity_agency_connection.Metrics.OPPORTUNITY_AGENCY_CONNECTION_COUNT
            ]
            == 5
        )
