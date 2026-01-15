import pytest

from src.data_migration.transformation.subtask.transform_competition_instruction import TransformCompetitionInstruction
from tests.src.data_migration.transformation.conftest import BaseTransformTestClass, setup_competition_instruction
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

        transform_competition_instruction.run_subtask()

        print(transform_competition_instruction.metrics)