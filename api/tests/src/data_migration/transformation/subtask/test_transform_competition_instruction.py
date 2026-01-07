import pytest

from src.data_migration.transformation.subtask.transform_competition_instruction import TransformCompetitionInstruction
from tests.src.data_migration.transformation.conftest import BaseTransformTestClass


class TestTransformCompetitionInstruction(BaseTransformTestClass):

    @pytest.fixture
    def transform_competition_instruction(self, transform_oracle_data_task, s3_config):
        return TransformCompetitionInstruction(transform_oracle_data_task, s3_config)

    def test_transform_competition_instruction(self):
        pass