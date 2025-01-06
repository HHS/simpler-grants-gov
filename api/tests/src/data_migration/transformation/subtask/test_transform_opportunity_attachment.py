import pytest
import tests.src.db.models.factories as f

from src.data_migration.transformation.subtask.transform_opportunity_attachment import TransformOpportunityAttachment
from tests.src.data_migration.transformation.conftest import BaseTransformTestClass, setup_opportunity_attachment


class TestTransformOpportunitySummary(BaseTransformTestClass):
    @pytest.fixture()
    def transform_opportunity_attachment(self, transform_oracle_data_task):
        return TransformOpportunityAttachment(transform_oracle_data_task)

    def test_transform_opportunity_attachment(self, db_session, transform_opportunity_attachment):

        opportunity1 = f.OpportunityFactory.create(opportunity_attachments=[])

        insert1 = setup_opportunity_attachment(create_existing=False, opportunity=opportunity1)
        insert2 = setup_opportunity_attachment(create_existing=False, opportunity=opportunity1)

        update1 = setup_opportunity_attachment(create_existing=True, opportunity=opportunity1)
        update2 = setup_opportunity_attachment(create_existing=True, opportunity=opportunity1)

        delete1 = setup_opportunity_attachment(create_existing=True, is_delete=True, opportunity=opportunity1)

        opportunity2 = f.OpportunityFactory.create(opportunity_attachments=[])

        # TODO - already processed, error scenarios

    def test_transform_opportunity_attachment_delete_but_current_missing(self, db_session, transform_opportunity_attachment):
        pass
