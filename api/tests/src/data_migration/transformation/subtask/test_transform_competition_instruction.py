import pytest

from src.data_migration.transformation.subtask.transform_competition_instruction import TransformCompetitionInstruction
from tests.src.data_migration.transformation.conftest import BaseTransformTestClass, setup_competition_instruction, validate_competition_instruction
from tests.src.db.models.factories import CompetitionFactory


class TestTransformCompetitionInstruction(BaseTransformTestClass):

    @pytest.fixture
    def transform_competition_instruction(self, transform_oracle_data_task, s3_config):
        return TransformCompetitionInstruction(transform_oracle_data_task, s3_config)

    def test_transform_competition_instruction(self, db_session, transform_competition_instruction, s3_config):

        competition1 = CompetitionFactory.create(legacy_package_id="PKG00001", legacy_competition_id=100001)
        insert1 = setup_competition_instruction(
            create_existing=False, competition=competition1, s3_config=s3_config,
        )

        competition2 = CompetitionFactory.create(legacy_package_id="PKG00002", legacy_competition_id=100002)
        update1 = setup_competition_instruction(
            create_existing=True, competition=competition2, s3_config=s3_config,
        )

        competition3 = CompetitionFactory.create(legacy_package_id="PKG00003", legacy_competition_id=100003)
        delete1 = setup_competition_instruction(
            create_existing=True, competition=competition3, s3_config=s3_config, is_delete=True
        )

        ####
        # Each of these competitions has an existing instructions record
        # that won't be affected (the factory will generate a different path)
        # Also mixing up the extensions
        ####

        competition4 = CompetitionFactory.create(legacy_package_id="PKG00004", legacy_competition_id=100004, with_instruction=True)
        insert2 = setup_competition_instruction(
            create_existing=False, competition=competition4, s3_config=s3_config, extension="docx"
        )

        competition5 = CompetitionFactory.create(legacy_package_id="PKG00005", legacy_competition_id=100005, with_instruction=True)
        update2 = setup_competition_instruction(
            create_existing=True, competition=competition5, s3_config=s3_config, extension=".PDF"
        )

        competition6 = CompetitionFactory.create(legacy_package_id="PKG00006", legacy_competition_id=100006, with_instruction=True)
        delete2 = setup_competition_instruction(
            create_existing=True, competition=competition6, s3_config=s3_config, is_delete=True
        )

        ####
        # These competitions have draft opportunities
        ####

        competition7 = CompetitionFactory.create(legacy_package_id="PKG00007", legacy_competition_id=100007)
        insert3 = setup_competition_instruction(
            create_existing=False, competition=competition7, s3_config=s3_config, extension=".a.B.c"
        )

        competition8 = CompetitionFactory.create(legacy_package_id="PKG00008", legacy_competition_id=100008)
        update3 = setup_competition_instruction(
            create_existing=True, competition=competition8, s3_config=s3_config, extension=".123 xyz"
        )

        transform_competition_instruction.run_subtask()

        print(transform_competition_instruction.metrics)

        ####
        # Validation
        ####
        # Inserts
        validate_competition_instruction(db_session, insert1, s3_config, expected_filename="PKG00001.pdf")
        validate_competition_instruction(db_session, insert2, s3_config, expected_filename="PKG00004.docx")
        validate_competition_instruction(db_session, insert3, s3_config, expected_filename="PKG00007.a.b.c")

        # Updates
        validate_competition_instruction(db_session, update1, s3_config, expected_filename="PKG00002.pdf")
        validate_competition_instruction(db_session, update2, s3_config, expected_filename="PKG00005.pdf")
        validate_competition_instruction(db_session, update3, s3_config, expected_filename="PKG00008.123 xyz")

        # Deletes
        validate_competition_instruction(db_session, delete1, s3_config, expect_in_db=False)
        validate_competition_instruction(db_session, delete2, s3_config, expect_in_db=False)