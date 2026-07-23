import logging
import uuid

from grants_shared.adapters import db
from grants_shared.util.env_config import PydanticBaseEnvConfig
from pydantic import Field
from sqlalchemy import select

from src.db.models.resource_models import MgmtInternalResource

logger = logging.getLogger(__name__)

INTERNAL_RESOURCE_NAME = "Internal"


class InternalResourceConfig(PydanticBaseEnvConfig):
    # The primary key of the statically defined internal resource record.
    # This is only set up locally for now - there is no terraform/SSM for it yet - so the
    # field is required and instantiated lazily (only when the internal resource is needed).
    mgmt_internal_resource_id: uuid.UUID = Field(alias="MGMT_INTERNAL_RESOURCE_ID")


def get_internal_resource(db_session: db.Session) -> MgmtInternalResource:
    """Fetch the statically defined internal resource record.

    Internal roles are checked against this singular resource rather than a null
    resource. This makes internal roles work the same as any other role in that they
    are always checked against a particular resource. Use it like::

        verify_access(user, {MgmtPrivilege.XYZ}, get_internal_resource(db_session))
    """
    config = InternalResourceConfig()

    internal_resource = db_session.execute(
        select(MgmtInternalResource).where(
            MgmtInternalResource.mgmt_internal_resource_id == config.mgmt_internal_resource_id
        )
    ).scalar_one_or_none()

    if internal_resource is None:
        raise ValueError(
            f"Internal resource {config.mgmt_internal_resource_id} does not exist - it must be created before it can be used"
        )

    return internal_resource


def create_internal_resource(db_session: db.Session) -> MgmtInternalResource:
    """Create the statically defined internal resource record if it does not already exist.

    This is idempotent - if a record with the configured ID already exists, it is returned
    unchanged rather than recreated. Requires resource automation to be set up so the backing
    ``mgmt_resource`` row is created alongside it.
    """
    config = InternalResourceConfig()

    log_extra = {"mgmt_internal_resource_id": config.mgmt_internal_resource_id}

    internal_resource = db_session.execute(
        select(MgmtInternalResource).where(
            MgmtInternalResource.mgmt_internal_resource_id == config.mgmt_internal_resource_id
        )
    ).scalar_one_or_none()

    if internal_resource is not None:
        logger.info("Internal resource already exists, skipping creation", extra=log_extra)
        return internal_resource

    internal_resource = MgmtInternalResource(
        mgmt_internal_resource_id=config.mgmt_internal_resource_id,
        internal_resource_name=INTERNAL_RESOURCE_NAME,
    )
    db_session.add(internal_resource)

    logger.info("Created internal resource", extra=log_extra)
    return internal_resource
