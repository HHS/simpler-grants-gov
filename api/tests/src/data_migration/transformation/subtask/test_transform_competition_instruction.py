import pytest

from src.data_migration.transformation import transform_constants
from src.data_migration.transformation.subtask.transform_competition_instruction import (
    TransformCompetitionInstruction,
    build_competition_instruction_file_name,
)
from tests.src.data_migration.transformation.conftest import (
    BaseTransformTestClass,
    setup_competition_instruction,
    validate_competition_instruction,
)
from tests.src.db.models.factories import CompetitionFactory, StagingTinstructionsFactory


class TestTransformCompetitionInstruction(BaseTransformTestClass):

    @pytest.fixture
    def transform_competition_instruction(self, transform_oracle_data_task, s3_config):
        return TransformCompetitionInstruction(transform_oracle_data_task, s3_config)

    def test_transform_competition_instruction(
        self, db_session, transform_competition_instruction, s3_config
    ):

        competition1 = CompetitionFactory.create(
            legacy_package_id="PKG00001", legacy_competition_id=100001
        )
        insert1 = setup_competition_instruction(
            create_existing=False,
            competition=competition1,
            s3_config=s3_config,
        )

        competition2 = CompetitionFactory.create(
            legacy_package_id="PKG00002", legacy_competition_id=100002
        )
        update1 = setup_competition_instruction(
            create_existing=True,
            competition=competition2,
            s3_config=s3_config,
        )

        competition3 = CompetitionFactory.create(
            legacy_package_id="PKG00003", legacy_competition_id=100003
        )
        delete1 = setup_competition_instruction(
            create_existing=True, competition=competition3, s3_config=s3_config, is_delete=True
        )

        ####
        # Each of these competitions has an existing instructions record
        # that won't be affected (the factory will generate a different path)
        # Also mixing up the extensions to verify that logic a bit
        ####
        competition4 = CompetitionFactory.create(
            legacy_package_id="PKG00004", legacy_competition_id=100004, with_instruction=True
        )
        insert2 = setup_competition_instruction(
            create_existing=False, competition=competition4, s3_config=s3_config, extension="docx"
        )

        competition5 = CompetitionFactory.create(
            legacy_package_id="PKG00005", legacy_competition_id=100005, with_instruction=True
        )
        update2 = setup_competition_instruction(
            create_existing=True, competition=competition5, s3_config=s3_config, extension=".PDF"
        )

        competition6 = CompetitionFactory.create(
            legacy_package_id="PKG00006", legacy_competition_id=100006, with_instruction=True
        )
        delete2 = setup_competition_instruction(
            create_existing=True, competition=competition6, s3_config=s3_config, is_delete=True
        )

        ####
        # These competitions have draft opportunities
        ####
        competition7 = CompetitionFactory.create(
            legacy_package_id="PKG00007", legacy_competition_id=100007
        )
        insert3 = setup_competition_instruction(
            create_existing=False, competition=competition7, s3_config=s3_config, extension=".a.B.c"
        )

        competition8 = CompetitionFactory.create(
            legacy_package_id="PKG00008", legacy_competition_id=100008
        )
        update3 = setup_competition_instruction(
            create_existing=True,
            competition=competition8,
            s3_config=s3_config,
            extension=".123 xyz",
        )

        # This was already processed, and won't be picked up
        competition9 = CompetitionFactory.create(
            legacy_package_id="PKG00009", legacy_competition_id=100009
        )
        insert_already_processed = setup_competition_instruction(
            create_existing=True,
            competition=competition9,
            s3_config=s3_config,
            extension="pdf",
            is_already_processed=True,
        )

        ####
        # Null legacy_package_id and extension cases
        ####

        competition10 = CompetitionFactory.create(
            legacy_package_id=None, legacy_competition_id=100010
        )
        null_package_id_case = setup_competition_instruction(
            create_existing=False, competition=competition10, s3_config=s3_config, extension="pdf"
        )

        competition11 = CompetitionFactory.create(
            legacy_package_id="PKG00011", legacy_competition_id=100011
        )
        null_extension_case = setup_competition_instruction(
            create_existing=False, competition=competition11, s3_config=s3_config, extension=None
        )

        transform_competition_instruction.run_subtask()

        ####
        # Validation
        ####
        # Inserts
        validate_competition_instruction(
            db_session, insert1, s3_config, expected_filename="PKG00001.pdf"
        )
        validate_competition_instruction(
            db_session, insert2, s3_config, expected_filename="PKG00004.docx"
        )
        validate_competition_instruction(
            db_session, insert3, s3_config, expected_filename="PKG00007.a.b.c"
        )

        # Updates
        validate_competition_instruction(
            db_session, update1, s3_config, expected_filename="PKG00002.pdf"
        )
        validate_competition_instruction(
            db_session, update2, s3_config, expected_filename="PKG00005.pdf"
        )
        validate_competition_instruction(
            db_session, update3, s3_config, expected_filename="PKG00008.123 xyz"
        )

        # Deletes
        validate_competition_instruction(db_session, delete1, s3_config, expect_in_db=False)
        validate_competition_instruction(db_session, delete2, s3_config, expect_in_db=False)

        # Already processed
        validate_competition_instruction(
            db_session, insert_already_processed, s3_config, expect_values_to_match=False
        )

        # Null legacy_package_id case
        validate_competition_instruction(
            db_session,
            null_package_id_case,
            s3_config,
            expect_in_db=False,
            is_null_package_or_extension=True,
        )
        validate_competition_instruction(
            db_session,
            null_extension_case,
            s3_config,
            expect_in_db=False,
            is_null_package_or_extension=True,
        )

        ### Metrics checks
        metrics = transform_competition_instruction.metrics
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 10
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 3
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 3
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 2
        assert metrics[transform_constants.Metrics.TOTAL_INVALID_RECORD_SKIPPED] == 2

    def test_transform_competition_instruction_null_instructions(
        self, db_session, enable_factory_create, s3_config, transform_competition_instruction
    ):
        competition = CompetitionFactory.create(
            legacy_package_id="PKGNULLINSTRUCTIONSCASE", legacy_competition_id=700001
        )
        error_case = setup_competition_instruction(
            create_existing=False,
            competition=competition,
            s3_config=s3_config,
            has_file_contents=False,
        )

        transform_competition_instruction.process_competition_instruction_group(
            [(error_case, None, competition)]
        )

        # Verify the erroring record didn't get its transformed_at set
        db_session.refresh(error_case)
        assert error_case.transformed_at is None

        metrics = transform_competition_instruction.metrics
        assert metrics[transform_constants.Metrics.TOTAL_ERROR_COUNT] == 1


@pytest.mark.parametrize(
    "extension,legacy_package_id,expected_filename",
    [
        ("pdf", "PKG001", "PKG001.pdf"),
        (".pdf", "PKG002", "PKG002.pdf"),
        ("PDF", "PKG003", "PKG003.pdf"),
        ("docx", "PKG004", "PKG004.docx"),
        ("a.b.c.d.f", "PKG005", "PKG005.a.b.c.d.f"),
        ("    pdf    ", "PKG006", "PKG006.pdf"),
        ("words pdf", "PKG007", "PKG007.words pdf"),
    ],
)
def test_build_competition_instruction_file_name(extension, legacy_package_id, expected_filename):
    instructions = StagingTinstructionsFactory.build(extension=extension)
    competition = CompetitionFactory.build(legacy_package_id=legacy_package_id)

    assert build_competition_instruction_file_name(instructions, competition) == expected_filename


def test_build_competition_instruction_file_name_null_extension():
    instructions = StagingTinstructionsFactory.build(extension=None)
    competition = CompetitionFactory.build(legacy_package_id="PKG001")
    with pytest.raises(ValueError, match="Competition has no extension"):
        build_competition_instruction_file_name(instructions, competition)


def test_build_competition_instruction_file_name_null_legacy_package_id():
    instructions = StagingTinstructionsFactory.build(extension="pdf")
    competition = CompetitionFactory.build(legacy_package_id=None)
    with pytest.raises(ValueError, match="Competition has no legacy package ID"):
        build_competition_instruction_file_name(instructions, competition)
