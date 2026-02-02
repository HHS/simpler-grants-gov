import logging
from enum import StrEnum

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.db.models.entity_models import SamGovEntity
from src.db.models.user_models import LinkExternalUser, User
from src.task.task import Task
from src.util.sam_gov_utils import link_sam_gov_entity_if_not_exists

logger = logging.getLogger(__name__)


class CreateOrgsFromSamEntityTask(Task):

    class Metrics(StrEnum):
        RECORDS_PROCESSED = "records_processed"

        NEW_ORGANIZATION_CREATED_COUNT = "new_organization_created_count"
        NEW_USER_ORGANIZATION_CREATED_COUNT = "new_organization_user_created_count"

    def run_task(self) -> None:
        with self.db_session.begin():
            sam_gov_entities = self.db_session.execute(
                select(SamGovEntity, LinkExternalUser)
                .join(LinkExternalUser, SamGovEntity.ebiz_poc_email == LinkExternalUser.email)
                # There can be blank email fields in the Sam.gov data
                # just in case a user ever ends up with a blank email
                # we want to avoid them becoming the org owner of 500 random orgs
                .where(SamGovEntity.ebiz_poc_email != "")
                .options(selectinload(SamGovEntity.organization))
                .options(selectinload(LinkExternalUser.user).selectinload(User.organization_users))
            )

            for sam_gov_entity, link_external_user in sam_gov_entities:
                self.process_sam_gov_entity_for_user(sam_gov_entity, link_external_user.user)

    def process_sam_gov_entity_for_user(self, sam_gov_entity: SamGovEntity, user: User) -> None:
        """Link a sam.gov entity record to the EBIZ POC (owner) through an organization record

        This is a wrapper around the shared utility function that handles metrics tracking
        for the task using the specific metric names expected by this task.
        """
        self.increment(self.Metrics.RECORDS_PROCESSED)

        def increment_with_task_metrics(metric_name: str) -> None:
            """Map generic metric names to task-specific ones"""
            metric_mapping = {
                "new_organization_created_count": self.Metrics.NEW_ORGANIZATION_CREATED_COUNT,
                "new_organization_user_created_count": self.Metrics.NEW_USER_ORGANIZATION_CREATED_COUNT,
            }
            if metric_name in metric_mapping:
                self.increment(metric_mapping[metric_name])

        link_sam_gov_entity_if_not_exists(
            self.db_session, sam_gov_entity, user, increment_with_task_metrics
        )
