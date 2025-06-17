import logging
import uuid
from enum import StrEnum

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.db.models.entity_models import Organization, SamGovEntity
from src.db.models.user_models import LinkExternalUser, OrganizationUser, User
from src.task.task import Task

logger = logging.getLogger(__name__)


class CreateOrgsFromSamEntityTask(Task):

    class Metrics(StrEnum):
        RECORDS_PROCESSED = "records_processed"

        NEW_ORGANIZATION_CREATED_COUNT = "new_organization_created_count"
        NEW_USER_ORGANIZATION_CREATED_COUNT = "new_organization_user_created_count"
        NEW_ORGANIZATION_OWNER_COUNT = "new_organization_owner_count"

    def run_task(self) -> None:
        with self.db_session.begin():
            sam_gov_entities = self.db_session.execute(
                select(SamGovEntity, LinkExternalUser)
                .join(LinkExternalUser, SamGovEntity.ebiz_poc_email == LinkExternalUser.email)
                .options(selectinload(SamGovEntity.organization))
                .options(selectinload(LinkExternalUser.user).selectinload(User.organizations))
            )

            for sam_gov_entity, link_external_user in sam_gov_entities:
                self.link_sam_gov_entity_if_not_exists(sam_gov_entity, link_external_user.user)

    def link_sam_gov_entity_if_not_exists(self, sam_gov_entity: SamGovEntity, user: User) -> None:
        """Link a sam.gov entity record to the EBIZ POC (owner) through an organization record

        This will potentially do the following:
        * Create the organization if it does not exist
        * Add the user to the organization if they aren't already
        * Mark that UserOrganization record as the owner of the organization

        Each of these steps is done independently, which means the following:
        * If the EBIZ POC email changes on the sam.gov entity record, a new owner will be added
        * If that owner was already in the org, they just get a new permission
        * Any existing owner will NOT be removed
        * If the organization, and owner are already setup, this will do nothing
        """
        self.increment(self.Metrics.RECORDS_PROCESSED)
        log_extra = {"sam_gov_entity_id": sam_gov_entity.sam_gov_entity_id, "user_id": user.user_id}
        logger.info("Processing sam.gov entity record connection to user", extra=log_extra)

        # If an organization does not already exist for the sam.gov entity
        # create and associate it
        organization = sam_gov_entity.organization
        if organization is None:
            self.increment(self.Metrics.NEW_ORGANIZATION_CREATED_COUNT)
            organization = Organization(organization_id=uuid.uuid4(), sam_gov_entity=sam_gov_entity)
            self.db_session.add(organization)

            log_extra["organization_id"] = organization.organization_id
            logger.info("Created new organization attached to sam.gov entity", extra=log_extra)
        else:
            log_extra["organization_id"] = organization.organization_id

        # If the user is not already a member of the organization, add them
        organization_user = None
        for org_user in user.organizations:
            if org_user.organization_id == organization.organization_id:
                organization_user = org_user
                break

        if organization_user is None:
            self.increment(self.Metrics.NEW_USER_ORGANIZATION_CREATED_COUNT)
            organization_user = OrganizationUser(organization=organization, user=user)
            self.db_session.add(organization_user)
            logger.info("Added user to organization", extra=log_extra)

        # As we know they're the ebiz POC from the initial query,
        # make them the owner if they aren't already
        if organization_user.is_organization_owner is not True:
            self.increment(self.Metrics.NEW_ORGANIZATION_OWNER_COUNT)
            organization_user.is_organization_owner = True
            logger.info("Made user an owner of the organization", extra=log_extra)
